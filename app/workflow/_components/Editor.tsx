"use client";

import { Workflow } from "@/lib/generated/prisma";
import { ReactFlowProvider } from "@xyflow/react";
import FlowEditor from "./FlowEditor";
import Topbar from "./topbar/topbar";
Topbar

function Editor({ workflow }: { workflow: Workflow }) {
    return (
        <ReactFlowProvider>
            <div className="flex flex-col h-full w-full overflow-hidden">
                <Topbar title="chicken" subTitle={workflow.name}/>
                <section className="flex h-full overflow-auto">
                    <FlowEditor workflow={workflow}/> 
                </section>
            </div>
        </ReactFlowProvider>
    );
}

export default Editor;