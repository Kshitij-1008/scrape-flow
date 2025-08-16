"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GetWorkflowExecutionWithPhases(executionId: string ) {

    const { userId } = auth();
    if (!userId) {
        throw new Error("Unauthenticated");
    };

    return prisma.workflowExecution.findUnique({
        where: {
            id: executionId,
            userId: userId,
        },
        include: {
            phases: {
                orderBy: {
                    number: "asc",
                },
            },
        },
    })
}