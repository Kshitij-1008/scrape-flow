import { TaskParameterType, TaskType } from "@/types/task";
import { LucideProps, TextIcon } from "lucide-react";

export const ExtractTextFromElementTask = {
    type: TaskType.EXTRACT_TEXT_FROM_ELEMENT,
    label: "Extract text from Element",
    icon: (props: LucideProps) => (
        <TextIcon className="stroke-rose-400" {...props} />
    ),
    isEntrypoint: false,
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
    ],
    outputs: [
        {
            name: "Extracted Text",
            type: TaskParameterType.STRING,
        },
    ],
};