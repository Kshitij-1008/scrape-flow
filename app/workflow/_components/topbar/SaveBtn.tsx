"use client";

import { UpdateWorkflow } from "@/actions/workflows/updateWorkflow";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";

function SaveBtn({ workflowId }: { workflowId: string }) {

    const { toObject } = useReactFlow();
    const saveMutation = useMutation({
        mutationFn: UpdateWorkflow,
        onSuccess: () => {
            toast.success("Workflow successfully updated", {id: "save-workflow"})
        },
        onError: () => {
            toast.error("Workflow unable to be updated", {id: "save-workflow"})
        }
    });

    return (
        <Button 
          variant={"outline"} 
          disabled={saveMutation.isPending}
          className="flex items-center gap-2" 
          onClick={() => {
            const workflowDefinition = JSON.stringify(toObject())
            toast.loading("Workflow updating...", {id: "save-workflow"});
            saveMutation.mutate({
                id: workflowId,
                definition: workflowDefinition,
            });
          }}
        >
            <CheckIcon size={16} className="stroke-green-400"/>
            Save
        </Button> 
    );
}

export default SaveBtn;