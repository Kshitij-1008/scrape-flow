import { LucideProps } from "lucide-react";
import React from "react";
import { TaskParameter, TaskType } from "./task";
import { AppNode } from "./appNode";

export enum WorkflowStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
}

export type WorkflowTask = {
    label: string;
    icon: React.FC<LucideProps>;
    type: TaskType;
    isEntryPoint?: boolean;
    inputs: TaskParameter[];
    outputs: TaskParameter[];
    credits: number;
}

export type WorkflowExecutionPlan = {
    phase: number;
    nodes: AppNode[];
}[];