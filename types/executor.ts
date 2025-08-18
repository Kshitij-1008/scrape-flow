import { Browser } from "puppeteer"
import { WorkflowTask } from "./workflow";

export type Environment = {
    browser? : Browser;
    // Phases with taskId/nodeId as key 
    phases: Record<string, {
        inputs : Record<string, string>,
        outputs: Record<string, string>
    }>;
};

// We specify here that ExecutionEnvironment is a type (T), which extends another type (WorkflowTask)
// This is the possible equivalent of WorkflowTask["inputs"][number]["name"]
// [number] is there since inputs is an array of objects and thus not directly accessible without indexing
export type ExecutionEnvironment<T extends WorkflowTask> = {
    getInput(name : T["inputs"][number]["name"]) : string;
};