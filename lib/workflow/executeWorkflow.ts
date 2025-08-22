import "server-only";
import prisma from "../prisma";
import { revalidatePath } from "next/cache";
import { ExecutionPhaseStatus, WorkflowExecutionStatus } from "@/types/workflow";
import { waitFor } from "../helper/waitFor";
import { ExecutionPhase } from "../generated/prisma";
import { AppNode } from "@/types/appNode";
import { TaskRegistry } from "./task/registry";
import { ExecutorRegistry } from "./executor/registry";
import { Environment, ExecutionEnvironment } from "@/types/executor";
import { TaskParameterType } from "@/types/task";
import { Browser, Page } from "puppeteer";
import { Edge } from "@xyflow/react";
import { LogCollector } from "@/types/log";
import { createLogCollector } from "../log";

export async function ExecuteWorkflow(executionId: string) {
    const execution = await prisma.workflowExecution.findUnique({
        where: {id: executionId},
        include: {workflow: true, phases: true},
    });

    if (!execution) {throw new Error("Execution not found")};

    const edges = JSON.parse(execution.definition).edges as Edge[];

    const environment : Environment = {phases: {}};

    await initializeWorkflowExecution(execution.id, execution.workflowId);
    await initializePhaseStatuses(execution);

    let creditsConsumed = 0;
    let executionFailed = false;
    for (const phase of execution.phases) {
        // Todo: Consume credits
        const phaseExecution = await executeWorkflowPhase(phase, environment, edges, execution.userId);
        creditsConsumed += phaseExecution.creditsConsumed
        if (!phaseExecution.success) {
            executionFailed = true;
            break;
        };
    }

    await finalizeWorkflowExecution(
        execution.id, execution.workflowId, 
        executionFailed, creditsConsumed
    );
    
    await cleanupEnvironment(environment);

    revalidatePath("/workflow/runs");
};

async function initializeWorkflowExecution(executionId: string, workflowId: string) {

    await prisma.workflowExecution.update({
        where: {id: executionId},
        data: {
            startedAt: new Date(),
            status: WorkflowExecutionStatus.RUNNING,
        },
    });

    await prisma.workflow.update({
        where: {id: workflowId},
        data: {
            lastRunAt: new Date(),
            lastRunStatus: WorkflowExecutionStatus.RUNNING,
            lastRunId: executionId, 
        },
    });
};

async function initializePhaseStatuses(execution : any) {
    await prisma.executionPhase.updateMany({
        where: {
            id: {
                in: execution.phases.map((phase : any) => phase.id),
            },
        },
        data: {
            status: ExecutionPhaseStatus.PENDING
        },
    });
};

async function finalizeWorkflowExecution(
    executionId : string, 
    workflowId : string, 
    executionFailed : boolean,
    creditsConsumed : number,
) {
    const finalStatus = executionFailed 
      ? WorkflowExecutionStatus.FAILED 
      : WorkflowExecutionStatus.COMPLETED;
    
    await prisma.workflowExecution.update({
        where : {
            id: executionId,
        },
        data: {
            completedAt: new Date(),
            status: finalStatus, 
            creditsConsumed: creditsConsumed,
        },
    });

    await prisma.workflow.update({
        where: {
            id : workflowId,
            lastRunId: executionId,
        },
        data: {
            lastRunStatus: finalStatus,
        },
    }).catch((err) => {});
};

async function executeWorkflowPhase(
    phase : ExecutionPhase, 
    environment: Environment, 
    edges : Edge[], 
    userId : string,
) {
    const logCollector = createLogCollector();
    const startedAt = new Date();
    const node = JSON.parse(phase.node) as AppNode
    
    setupEnvironmentForPhase(node, environment, edges);

    // Update phase status
    await prisma.executionPhase.update({
        where: {id: phase.id},
        data: {
            status: ExecutionPhaseStatus.RUNNING,
            startedAt: startedAt,
            inputs: JSON.stringify(environment.phases[node.id].inputs),
        },
    });

    const creditsRequired = TaskRegistry[node.data.type].credits;

    let success = await executePhase(phase, node, environment, logCollector);
    if (success) {
        // Execute phase if sufficient credits are present.
        success = await decrementCredits(userId, creditsRequired, logCollector);
    };
    const creditsConsumed = success ? creditsRequired : 0;
    
    const outputs = JSON.stringify(environment.phases[node.id].outputs)
    await finalizePhase(phase.id, success, outputs, logCollector, creditsConsumed);
    return { success, creditsConsumed };
};

async function finalizePhase(
    phaseId: string, 
    success: boolean,
    outputs: string,
    logCollector : LogCollector,
    creditsConsumed : number
) {
    const finalStatus = success ? ExecutionPhaseStatus.COMPLETED : ExecutionPhaseStatus.FAILED;

    await prisma.executionPhase.update({
        where: {id : phaseId},
        data: {
            status: finalStatus,
            completedAt: new Date(),
            outputs: outputs,
            creditsConsumed : creditsConsumed,
            logs: {
                createMany: {
                    data: logCollector.getAll().flatMap(log => ({
                        message: log.message,
                        timestamp : log.timestamp,
                        logLevel : log.level
                    }))
                }
            }
        },
    });
};

async function executePhase( 
    phase: ExecutionPhase, 
    node: AppNode,
    environment: Environment,
    logCollector : LogCollector,
) : Promise<boolean> {

    const runFn = ExecutorRegistry[node.data.type];
    if (!runFn) {return false};

    const executionEnvironment : ExecutionEnvironment<any> 
        = createExecutionEnvironment(node, environment, logCollector);

    return await runFn(executionEnvironment);
};

function setupEnvironmentForPhase(node: AppNode, environment: Environment, edges: Edge[]) {

    environment.phases[node.id] = { inputs : {}, outputs: {} };

    const inputs = TaskRegistry[node.data.type].inputs;
    for (const input of inputs) {
        // Input comes manually from user
        if (input.type === TaskParameterType.BROWSER_INSTANCE) {continue};
        const inputValue = node.data.inputs[input.name];
        if (inputValue) {
            environment.phases[node.id].inputs[input.name] = inputValue;
            continue
        };

        // Value comes from connection to an output (validation already done)
        const connectedEdge = edges.find((edge) => (
            edge.target === node.id && edge.targetHandle === input.name
        ));

        if (!connectedEdge) {
            console.error("Missing edge for input:", input.name,", Node ID:", node.id);
            continue;
        }
        const connectedInput = environment.phases[connectedEdge.source].outputs[connectedEdge.sourceHandle!];
        environment.phases[node.id].inputs[input.name] = connectedInput;
    };
};

function createExecutionEnvironment(
    node: AppNode, 
    environment: Environment,
    logCollector : LogCollector,
) : ExecutionEnvironment<any> {
    return {
        getInput: (name : string) => environment.phases[node.id]?.inputs[name],
        setOutput: (name: string, value: string) => {
            environment.phases[node.id].outputs[name] = value 
        },

        getBrowser: () => environment.browser,
        setBrowser: (browser: Browser) => environment.browser = browser,

        getPage: () => environment.page,
        setPage: (page: Page) => environment.page = page,

        log : logCollector,
    };
};

async function cleanupEnvironment(environment: Environment) {
    if (environment.browser) {
        await environment.browser.close().catch(err => console.error("Cannot close browser:", err));
    }
}

async function decrementCredits(userId : string, amount: number, logCollector : LogCollector,) {
    try {
        await prisma.userBalance.update({
            where: {userId: userId, credits: {gte: amount}},
            data: {credits : {decrement: amount}},
        });
        return true;
    } catch (error) {
        logCollector.error("Insufficient balance");
        return false;
    }
}