import { AppNode, AppNodeMissingInputs } from "@/types/appNode";
import { WorkflowExecutionPlan, WorkflowExecutionPlanPhase } from "@/types/workflow";
import { Edge } from "@xyflow/react";
import { TaskRegistry } from "./task/registry";

export enum FlowToExecutionPlanValidationError {
    "NO_ENTRY_POINT",
    "INVALID_INPUTS",
}

type FlowToExecutionPlanType = {
    executionPlan?: WorkflowExecutionPlan;
    error?: {
        type: FlowToExecutionPlanValidationError;
        invalidElements?: AppNodeMissingInputs[];
    }
}

export function FlowToExecutionPlan( nodes: AppNode[], edges: Edge[]) : FlowToExecutionPlanType {

    const entryPoint = nodes.find((node) => TaskRegistry[node.data.type].isEntryPoint);
    if (!entryPoint) {
        return {
            error: {
                type: FlowToExecutionPlanValidationError.NO_ENTRY_POINT,
            }
        };
    };
    
    const inputsWithErrors: AppNodeMissingInputs[] = [];
    const planned = new Set<string>(); //Going to run the loop till all nodes have been added

    const invalidInputs = getInvalidInputs(entryPoint, edges, planned);
    if (invalidInputs.length > 0) {
        inputsWithErrors.push({
            nodeId: entryPoint.id,
            inputs: invalidInputs,
        });
    }
    
    const executionPlan : WorkflowExecutionPlan = [
        {
            phase: 1, 
            nodes: [entryPoint]
        },
    ];
    
    planned.add(entryPoint.id)
    console.log("phase:", 1, "Planned set check:", planned)

    for (let phase = 2; 
        phase <= nodes.length && planned.size < nodes.length; 
        phase ++ 
    ) {
        const nextPhase: WorkflowExecutionPlanPhase = { phase, nodes: [] }

        for (const currentNode of nodes) {
            if (planned.has(currentNode.id)) {
                // Node already planned to be executed
                continue
            };

            const invalidInputs = getInvalidInputs(currentNode, edges, planned);
            if (invalidInputs.length > 0) {
                const incomers = getIncomers(currentNode, nodes, edges); //To be specified customly because it's not a valid function in backend.
                if (incomers.every(incomer => planned.has(incomer.id))) {
                    // If all incomers are planned and there are still invalid inputs, 
                    // this means that this particular node has an invalid input
                    // which means that the workflow is invalid
                    console.error("Invalid inputs", currentNode.id, invalidInputs);
                    inputsWithErrors.push({
                        nodeId: currentNode.id,
                        inputs: invalidInputs,
                    });
                } else {
                    continue;
                }
            }

            // At this stage, our node has been validated and can be planned to be executed.
            nextPhase.nodes.push(currentNode);
        }

        for (const node of nextPhase.nodes) {
            planned.add(node.id);
        };
        console.log("phase:", phase, "Planned set check:", planned)
        executionPlan.push(nextPhase);
    }

    if (inputsWithErrors.length > 0) {
        return {
            error: {
                type: FlowToExecutionPlanValidationError.INVALID_INPUTS,
                invalidElements: inputsWithErrors,
            }
        }
    }
    
    return { executionPlan };
}

function getInvalidInputs(node: AppNode, edges: Edge[], planned: Set<string>) {
    
    const invalidInputs = [];
    const inputs = TaskRegistry[node.data.type].inputs;

    for (const input of inputs) {
        const inputValue = node.data.inputs[input.name];
        const inputValueProvided = inputValue?.length > 0;
        if (inputValueProvided) {continue}; // if inputValue is provided, then we can move on 

        // If the input value is not provided, then we need to check 
        // whether there is an output linked to the current input
        const incomingEdges = edges.filter((edge) => edge.target === node.id);
        const inputLinkedToOutput = incomingEdges.find((edge) => edge.targetHandle === input.name);

        const requiredInputProvidedByVisitedOutput = 
            input.required && inputLinkedToOutput && planned.has(inputLinkedToOutput.source);
        
        if (requiredInputProvidedByVisitedOutput) {
            // input is required and we have a valid value for it 
            // from incoming edges supplied via another planned node
            continue;
        } else if (!input.required) {
            // If the input isn't required but output is linked to it
            // then we need to make sure that the output is already planned
            if (!inputLinkedToOutput) {continue};
            if (inputLinkedToOutput && planned.has(inputLinkedToOutput.source)) {continue};

        }

        invalidInputs.push(input.name)
    }

    return invalidInputs;
};

function getIncomers(node: AppNode, nodes: AppNode[], edges: Edge[]) {
    /** It's a util designed to get the nodes, if any, that are connected to the current node 
    // as a source node of an edge; basically to get the nodes which feed the inputs of the current node*/

    if (!node.id) {
        return []
    };

    const incomerIds = new Set();
    edges.forEach((edge) => {
        if (edge.target === node.id) {
            incomerIds.add(edge.source)
        }
    });

    return nodes.filter((node) => incomerIds.has(node.id));
}