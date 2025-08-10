"use client";
import { Workflow } from "@/lib/generated/prisma";
import { CreateFlowNode } from "@/lib/workflow/createFlowNode";
import { TaskType } from "@/types/task";
import { 
    addEdge,
    Background, 
    BackgroundVariant, 
    Connection, 
    Controls, 
    Edge, 
    ReactFlow, 
    useEdgesState, 
    useNodesState, 
    useReactFlow
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import NodeComponent from "./nodes/NodeComponent";
import React, { useCallback, useEffect } from "react";
import { AppNode } from "@/types/appNode";
import DeletableEdge from "./edges/DeletableEdge";
import { TaskRegistry } from "@/lib/workflow/task/registry";

const nodeTypes = {
    FlowScrapeNode: NodeComponent,
}; // Ensures that custom node UI can be implemented by marking the created flow nodes a certain type

const edgeTypes = {
    default: DeletableEdge,
}

const snapGrid: [number, number] = [50, 50]; //To constrain the motion of the node, makes it easier to connect edges and nodes later on 
const fitViewOptions = { padding: 1 }; // Centers upon refresh and this specific variable provides spacing around the workflow

function FlowEditor({ workflow } : {workflow: Workflow}) {

    const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { setViewport, screenToFlowPosition, updateNodeData } = useReactFlow();

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

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const taskType = event.dataTransfer.getData("application/reactflow");
        if (typeof taskType === undefined || !taskType) return;

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        }, 
            {
                snapToGrid: true
            }
        )
        const newNode = CreateFlowNode(taskType as TaskType, position);
        setNodes((prev_nodes) => prev_nodes.concat(newNode));
    }, [setNodes, screenToFlowPosition]);

    const onConnect = useCallback((connection: Connection) => {
        setEdges((prev_edges) => addEdge({...connection, animated: true}, prev_edges));
        if (!connection.targetHandle) return;

        // Remove input value if it's been inputted by the user
        const node = nodes.find((node) => node.id === connection.target);
        if (!node) return;
        const nodeInputs = node.data.inputs;
        // delete nodeInputs[connection.targetHandle]
        // updateNodeData(node.id, {inputs: nodeInputs});
        updateNodeData(node.id, {
            inputs: {
                ...nodeInputs,
                [connection.targetHandle]: ""
            },
        });
    }, [setEdges, nodes, updateNodeData]);

    const isValidConnection = useCallback((connection: Edge | Connection) => {
        // 1. No self-connection allowed
        if (connection.source === connection.target) {return false};

        // 2. Same TaskParameterType connection
        const source_node = nodes.find((node) => node.id === connection.source);
        const target_node = nodes.find((node) => node.id === connection.target);
        if (!source_node || !target_node) {
            console.error("Source or target node not found")
            return false
        };

        const source_task = TaskRegistry[source_node.data.type]
        const target_task = TaskRegistry[target_node.data.type]
        
        const output = source_task.outputs.find((output) => output.name === connection.sourceHandle);
        const input = target_task.inputs.find((input) => input.name === connection.targetHandle);

        if (output?.type !== input?.type) {
            console.error("Invalid connection: Type-mismatch detected")
            return false
        };

        return true;
    }, [nodes])

    console.log("@Nodes", nodes);
    console.log("@Edges", edges);

    return (
        <main className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              snapToGrid={true}
              snapGrid={snapGrid}
              fitViewOptions={fitViewOptions}
              fitView
              onDragOver={onDragOver}
              onDrop={onDrop}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
            >
                <Controls position="top-left" fitViewOptions={fitViewOptions} />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1}/>
            </ReactFlow>
        </main>
    );
}

export default FlowEditor;