import { Browser, Page } from "puppeteer"
import { WorkflowTask } from "./workflow";
import { LogCollector } from "./log";

export type Environment = {
    browser? : Browser;
    page?: Page;
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
    setOutput(name: T["outputs"][number]["name"], value: string) : void;

    getBrowser() : Browser | undefined;
    setBrowser(browser : Browser) : void;

    getPage() : Page | undefined;
    setPage(page : Page) : void;

    log : LogCollector;
};
