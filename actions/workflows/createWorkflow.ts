"use server";

import prisma from "@/lib/prisma";
import { createWorkflowSchema, createWorkflowSchemaType } from "@/schema/workflows";
import { WorkflowStatus } from "@/types/workflow";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppNode } from "@/types/appNode";
import { Edge } from "@xyflow/react";
import { CreateFlowNode } from "@/lib/workflow/createFlowNode";
import { TaskType } from "@/types/task";

export async function CreateWorkfow(
    form: createWorkflowSchemaType
) {
    const {success, data} = createWorkflowSchema.safeParse(form);
    if (!success) {
        throw new Error("Invalid form data.")
    };

    const { userId } = auth();
    if (!userId) {
        throw new Error("Authentication error.")
    };

    const initFlow : {nodes: AppNode[], edges: Edge[]} = {
        nodes: [],
        edges: []
    };

    // Adding the flow entry point
    initFlow.nodes.push(CreateFlowNode(TaskType.LAUNCH_BROWSER))
    
    const result = await prisma.workflow.create({
        data: {
            userId,
            status: WorkflowStatus.DRAFT,
            definition: JSON.stringify(initFlow),
            ...data
        }
    });
    if (!result) {
        throw new Error("Failed to create workflow");
    };

    redirect(`/workflow/editor/${result.id}`)
}
