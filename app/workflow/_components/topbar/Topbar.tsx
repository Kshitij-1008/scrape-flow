"use client";

import TooltipWrapper from "@/components/TooltipWrapper";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopBarProps {
    title: string;
    subTitle: string;
}

function Topbar({title, subTitle}: TopBarProps) {

    const router = useRouter();

    return (
        <header className="flex p-2 border-b-2 border-separate justify-between w-full h-[60px] sticky top-0 bg-background z-10">
            <div className="flex gap-1 flex-1">
                <TooltipWrapper content={"Back"}>
                    <Button variant={"ghost"} size={"icon"} onClick={() => router.back()}>
                        <ChevronDownIcon size={20} />
                    </Button>
                </TooltipWrapper>
                <div>
                    <p className="font-bold text-ellipsis truncate">{title}</p>
                    <p>{subTitle}</p>
                </div>
            </div>
        </header>
    );
}

export default Topbar;