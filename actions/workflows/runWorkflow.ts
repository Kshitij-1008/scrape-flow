"use server";
import prisma from "@/lib/prisma";
import { FlowToExecutionPlan } from "@/lib/workflow/executionPlan";
import { TaskRegistry } from "@/lib/workflow/task/registry";
import { ExecutionPhaseStatus, WorkflowExecutionPlan, WorkflowExecutionStatus, WorkflowExecutionTrigger } from "@/types/workflow";
import { auth } from "@clerk/nextjs/server";

 

export async function RunWorkflow(form : {workflowId: string, flowDefinition?: string}) {

    const { userId } = auth();
    if (!userId) {
        throw new Error("Unauthenticated");
    };

    const { workflowId, flowDefinition} = form;
    if (!workflowId) {
        throw new Error("Workflow ID is required");
    };

    const workflow = await prisma.workflow.findUnique({
        where: {
            id: workflowId,
            userId: userId,
        }
    });

    if (!workflow) {
        throw new Error("Workflow not found")
    };

    let executionPlan : WorkflowExecutionPlan;
    if (!flowDefinition) {
        throw new Error("Flow Definition is not defined");
    };

    const flow = JSON.parse(flowDefinition);
    //Generating execution plan in backend (can't use the hook thus we made a separate function beforehand in a different file)
    const result = FlowToExecutionPlan(flow.nodes, flow.edges);
    if (result.error) {
        throw new Error("Flow definition not valid");
    };

    if (!result.executionPlan) {
        throw new Error("No execution plan generated")
    };

    executionPlan = result.executionPlan;
    
    const execution = await prisma.workflowExecution.create({
        data: {
            workflowId: workflowId,
            userId: userId,
            status: WorkflowExecutionStatus.PENDING,
            startedAt: new Date(),
            trigger: WorkflowExecutionTrigger.MANUAL,
            phases: {
                // Creation of the ExecutionPhase table
                create: executionPlan.flatMap((phase) => {
                    return phase.nodes.flatMap((node) => {
                        return {
                            userId: userId,
                            status: ExecutionPhaseStatus.CREATED,
                            number: phase.phase,
                            node: JSON.stringify(node),
                            name: TaskRegistry[node.data.type].label,
                        };
                    });
                }), //flatMap because each phase contains the nodes in a array
            },
        },
        select: {
            id: true,
            phases: true,
        },
    });

    if (!execution) {
        throw new Error("Workflow execution not created")
    }
}