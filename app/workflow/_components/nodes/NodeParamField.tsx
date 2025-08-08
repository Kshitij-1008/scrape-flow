"use client";
import { TaskParameter, TaskParameterType } from "@/types/task";
import StringParam from "./parameters/StringParam";
import { useReactFlow } from "@xyflow/react";
import { AppNode } from "@/types/appNode";
import { useCallback } from "react";

function NodeParamField({param, nodeId} : {param: TaskParameter; nodeId: string}) {

    const { updateNodeData, getNode } = useReactFlow();
    const node = getNode(nodeId) as AppNode;
    const value = node?.data.inputs?.[param.name];

    const updateNodeParamValue = useCallback((newValue: string) => {
        updateNodeData(nodeId, {
            inputs: {
                ...node?.data.inputs,
                [param.name] : newValue,
            }
        })
    }, [updateNodeData, param.name, nodeId, node?.data.inputs])

    switch(param.type) {
        case TaskParameterType.STRING:
            return (
                <StringParam param={param} value={value} updateNodeParamValue={updateNodeParamValue}/>
            );

        default: return (
            <div className="w-full">
                <p className="text-xs text-muted-foreground">Not Implemented</p>
            </div>
        );   
    }
}

export default NodeParamField;