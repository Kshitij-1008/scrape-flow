import { TaskParameterType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflow";
import { CodeIcon, LucideProps } from "lucide-react";

export const PageToHtmlTask = {
    type: TaskType.PAGE_TO_HTML,
    label: "Get HTML from Page",
    icon: (props: LucideProps) => (
        <CodeIcon className="stroke-rose-400" {...props} />
    ),
    isEntryPoint: false,
    credits: 2,
    inputs: [
        {
            name: "Web Page",
            type: TaskParameterType.BROWSER_INSTANCE,
            required: true,
            hideHandle: false,
        },
    ] as const,
    outputs: [
        {
            name: "HTML",
            type: TaskParameterType.STRING
        },
        {
            name: "Web Page",
            type: TaskParameterType.BROWSER_INSTANCE
        }
    ] as const,
} satisfies WorkflowTask;