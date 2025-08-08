export enum TaskType {
    LAUNCH_BROWSER = "LAUNCH_BROWSER",
}

export enum TaskParameterType {
    STRING = "STRING"
}

export interface TaskParameter {
    name: string;
    type: TaskParameterType;
    helperText?: string;
    required?: boolean;
    hideHandle?: boolean;
    [key: string] : any;
}