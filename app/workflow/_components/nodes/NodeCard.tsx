"use client";
import React from "react";

 

function NodeCard({ children, nodeId }: { nodeId: string, children: React.ReactNode }) {
    return (
        <div>{children}</div>
    );
}

export default NodeCard;