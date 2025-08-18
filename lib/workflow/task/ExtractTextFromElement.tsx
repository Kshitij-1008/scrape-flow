import { TaskParameterType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflow";
import { LucideProps, TextIcon } from "lucide-react";

export const ExtractTextFromElementTask = {
    type: TaskType.EXTRACT_TEXT_FROM_ELEMENT,
    label: "Extract text from Element",
    icon: (props: LucideProps) => (
        <TextIcon className="stroke-rose-400" {...props} />
    ),
    isEntryPoint: false,
    credits: 2,
    inputs: [
        {
            name: "HTML",
            type: TaskParameterType.STRING,
            required: true,
            variant: "textarea",
            hideHandle: false,
        },
        {
            name: "Selector",
            type: TaskParameterType.STRING,
            required: true,
            hideHandle: false,
        }
    ] as const,
    outputs: [
        {
            name: "Extracted Text",
            type: TaskParameterType.STRING,
        },
    ] as const,
} satisfies WorkflowTask;