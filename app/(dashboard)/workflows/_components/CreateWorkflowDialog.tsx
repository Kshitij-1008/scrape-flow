"use client"; 
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import React, { useState } from "react";

function CreateWorkflowDialog({ triggerText } : { triggerText?: string }) {

    const [isOpen, setOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>{triggerText ?? "Create workflow"}</Button>
            </DialogTrigger>
        </Dialog>
    );
}

export default CreateWorkflowDialog;