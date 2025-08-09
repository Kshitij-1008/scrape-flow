"use server";

import prisma from "@/lib/prisma";
import { WorkflowStatus } from "@/types/workflow";
import { auth } from "@clerk/nextjs/server";

export async function UpdateWorkflow({ id, definition } : {
    id: string; 
    definition: string; 
}) {
    
    const { userId } = auth();
    if (!userId) {
        throw new Error("Unauthenticated");
    };

    const workflow = await prisma.workflow.findUnique({
        where: {
            id: id,
            userId: userId,
        },
    });

    if (!workflow) {
        throw new Error("Workflow not found");
    };

    if (workflow.status !== WorkflowStatus.DRAFT) {
        throw new Error("Workflow is not a draft");
    }

    await prisma.workflow.update({
        where: {
            id: id,
            userId: userId,
        },
        data: {
            definition: definition,
        }
    })
}