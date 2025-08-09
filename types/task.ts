export enum TaskType {
    LAUNCH_BROWSER = "LAUNCH_BROWSER",
    PAGE_TO_HTML = "PAGE_TO_HTML",
}

export enum TaskParameterType {
    STRING = "STRING",
    BROWSER_INSTANCE = "BROWSER_INSTANCE",
}

export interface TaskParameter {
    name: string;
    type: TaskParameterType;
    helperText?: string;
    required?: boolean;
    hideHandle?: boolean;
    [key: string] : any;
}