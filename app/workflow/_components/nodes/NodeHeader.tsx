"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateFlowNode } from "@/lib/workflow/createFlowNode";
import { TaskRegistry } from "@/lib/workflow/task/registry";
import { AppNode } from "@/types/appNode";
import { TaskType } from "@/types/task";
import { useReactFlow } from "@xyflow/react";
import { CoinsIcon, CopyIcon, GripVerticalIcon, TrashIcon } from "lucide-react";

function NodeHeader({ taskType, nodeId} : { taskType: TaskType; nodeId: string }) {

    const task = TaskRegistry[taskType]
    const { deleteElements, getNode, addNodes } = useReactFlow();

    return (
        <div className="flex items-center gap-2 p-2">
            <task.icon size={16} />
            <div className="flex justify-between items-center w-full">
                <p className="text-xs font-bold uppercase text-muted-foreground">
                    {task.label}
                </p>
                <div className="flex gap-1 items-center">
                    {task.isEntryPoint && <Badge suppressHydrationWarning>Entry Point</Badge>}
                    <Badge className="gap-2 flex items-center text-xs">
                        <CoinsIcon size={16} /> {task.credits}
                    </Badge>
                    {!task.isEntryPoint && (
                        <>
                            <Button 
                              variant={"ghost"} 
                              size={"icon"}
                              onClick={() => {
                                deleteElements({
                                    nodes: [{ id: nodeId }],
                                });
                              }}
                            >
                                <TrashIcon size={12} />
                            </Button>
                            <Button 
                              variant={"ghost"} 
                              size={"icon"}
                              onClick={() => {
                                const node = getNode(nodeId) as AppNode;
                                const newNode = CreateFlowNode(taskType, {
                                    x: node.position.x + node.measured?.width! + 20, 
                                    y: node.position.y,});
                                addNodes([newNode]);
                              }}
                            >
                                <CopyIcon size={12} />
                            </Button> 
                        </>
                    )}
                    <Button variant={"ghost"} size={"icon"} className="drag-handle cursor-grab">
                        <GripVerticalIcon size={20} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
export default NodeHeader;