"use client";
import { Workflow } from "@/lib/generated/prisma";
import { CreateFlowNode } from "@/lib/workflow/createFlowNode";
import { TaskType } from "@/types/task";
import { 
    Background, 
    BackgroundVariant, 
    Controls, 
    ReactFlow, 
    useEdgesState, 
    useNodesState, 
    useReactFlow
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import NodeComponent from "./nodes/NodeComponent";
import { useEffect } from "react";

const nodeTypes = {
    FlowScrapeNode: NodeComponent,
}; // Ensures that custom node UI can be implemented by marking the created flow nodes a certain type

const snapGrid: [number, number] = [50, 50]; //To constrain the motion of the node, makes it easier to connect edges and nodes later on 
const fitViewOptions = { padding: 1.5 }; // Centers upon refresh and this specific variable provides spacing around the workflow

function FlowEditor({ workflow } : {workflow: Workflow}) {

    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { setViewport } = useReactFlow();

    // Ensures that the inputs stay after refresh
    useEffect(() => {
        try {
            const flow = JSON.parse(workflow.definition);
            if (!flow) return;
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
            if (!flow.viewport) return;
            const { x=0, y=0, zoom=1 } = flow.viewport;
            setViewport({x, y, zoom});
        } catch (error) {}
    }, [setNodes, setEdges, workflow.definition, setViewport]);

    return (
        <main className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              snapToGrid={true}
              snapGrid={snapGrid}
              fitViewOptions={fitViewOptions}
              fitView
            >
                <Controls position="top-left" fitViewOptions={fitViewOptions} />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1}/>
            </ReactFlow>
        </main>
    );
}

export default FlowEditor;