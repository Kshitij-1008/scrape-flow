import { ExecutionPhase } from "../generated/prisma";

type Phase = Pick<ExecutionPhase, "creditsConsumed">;

export function GetPhasesTotalCost(phases: Phase[]){
    return phases.reduce((accumulator, phase) => accumulator + (phase.creditsConsumed || 0), 0)
}