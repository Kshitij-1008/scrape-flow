import "server-only";
import prisma from "../prisma";
import { revalidatePath } from "next/cache";
import { ExecutionPhaseStatus, WorkflowExecutionStatus } from "@/types/workflow";
import { waitFor } from "../helper/waitFor";
import { ExecutionPhase } from "../generated/prisma";
import { AppNode } from "@/types/appNode";
import { TaskRegistry } from "./task/registry";

export async function ExecuteWorkflow(executionId: string) {
    const execution = await prisma.workflowExecution.findUnique({
        where: {id: executionId},
        include: {workflow: true, phases: true},
    });

    if (!execution) {throw new Error("Execution not found")};

    const environemnt = {phases: {}};

    await initializeWorkflowExecution(execution.id, execution.workflowId);
    await initializePhaseStatuses(execution);

    let creditsConsumed = 0;
    let executionFailed = false;
    for (const phase of execution.phases) {
        // Todo: Consume credits
        const phaseExecution = await executeWorkflowPhase(phase);
        if (!phaseExecution.success) {
            executionFailed = true;
            break;
        };
    }

    await finalizeWorkflowExecution(
        execution.id, execution.workflowId, 
        executionFailed, creditsConsumed
    );
    // clean up the environment, i.e, close the runs browser
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

async function executeWorkflowPhase(phase : ExecutionPhase) {
    const startedAt = new Date();
    const node = JSON.parse(phase.node) as AppNode
    
    // Update phase status
    await prisma.executionPhase.update({
        where: {id: phase.id},
        data: {
            status: ExecutionPhaseStatus.RUNNING,
            startedAt: startedAt,

        },
    });

    const creditsRequired = TaskRegistry[node.data.type].credits;
    console.log(`Executing phase: ${phase.name} with ${creditsRequired} credits required`);

    // TODO: Decrement user balance with creditsRequired

    // Simulating a phase simulation
    await waitFor(2000);
    const success = Math.random() < 0.7;

    await finalizePhase(phase.id, success);
    return { success };
};

async function finalizePhase(phaseId: string, success: boolean) {
    const finalStatus = success ? ExecutionPhaseStatus.COMPLETED : ExecutionPhaseStatus.FAILED;

    await prisma.executionPhase.update({
        where: {id : phaseId},
        data: {
            status: finalStatus,
            completedAt: new Date(),
        },
    })
}