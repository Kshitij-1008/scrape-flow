"use client";

import { RunWorkflow } from "@/actions/workflows/runWorkflow";
import useExecutionPlan from "@/components/hooks/useExecutionPlan";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { PlayIcon } from "lucide-react";
import { toast } from "sonner";

function ExecuteBtn({ workflowId }: { workflowId: string }) {

    const { toObject } = useReactFlow();
    const generate = useExecutionPlan();
    const mutation = useMutation({
      mutationFn: RunWorkflow,
      onSuccess: () => {
        toast.success("Workflow execution started", {id: "flow-execution"})
      },
      onError: () => {
        toast.error("Unable to execute workflow", {id: "flow-execution"})
      },
    })

    return (
        <Button
          variant={"outline"}
          disabled={mutation.isPending}
          className="flex items-center gap-2"
          onClick={() => {
            const plan = generate();
            if (!plan) { return}; //Client-side validation
            mutation.mutate({
              workflowId: workflowId, 
              flowDefinition: JSON.stringify(toObject()),
            })
            // console.log("--- plan ----");
            // console.table(plan)
          }}
        >
            <PlayIcon size={16} className="stroke-orange-400" />
            Execute
        </Button>
    );
}

export default ExecuteBtn;