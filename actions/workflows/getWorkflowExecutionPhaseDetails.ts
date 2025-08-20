"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GetWorkflowExecutionPhaseDetails(phaseId : string) {
    const { userId } = auth();
    if (!userId) {
        throw new Error("Unauthenticated");
    };

    return prisma.executionPhase.findUnique({
        where: {
            id: phaseId,
            userId: userId,
            // If we didn't have userId in the execution Phase table but 
            // we did in its parent table Workflow Execution then we can access it
            // execution: {
            //     userId: userId,
            // },
        },
        include : {
            logs : {
                orderBy : {timestamp : "asc"}
            }
        }
    })
}