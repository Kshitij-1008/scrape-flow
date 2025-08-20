"use client";

import { GetWorkflowExecutionWithPhases } from "@/actions/workflows/getWorkflowExecutionWithPhases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GetPhasesTotalCost } from "@/lib/helper/phases";
import { DatesToDurationString } from "@/lib/helper/dates";
import { cn } from "@/lib/utils";
import { WorkflowExecutionStatus } from "@/types/workflow";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CalendarIcon, CircleDashedIcon, ClockIcon, CoinsIcon, Loader2Icon, LucideIcon, WorkflowIcon } from "lucide-react";
import { ReactNode, useState } from "react";
import { GetWorkflowExecutionPhaseDetails } from "@/actions/workflows/getWorkflowExecutionPhaseDetails";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ExecutionData = Awaited<ReturnType<typeof GetWorkflowExecutionWithPhases>>;

// ExecutionViewer is wrapped in the server component "ExecutionViewerWrapper"
export default function ExecutionViewer({initialData} : { initialData: ExecutionData }) {

    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
    
    // To continuous update the data so the user can observe the execution
    const query = useQuery({
        queryKey: ["execution", initialData?.id],
        initialData,
        queryFn: () => GetWorkflowExecutionWithPhases(initialData!.id),
        refetchInterval: (query) => 
            query.state.data?.status === WorkflowExecutionStatus.RUNNING ? 1000 : false,
    });

    const phaseDetails = useQuery({
        queryKey: ["phaseDetails", selectedPhase],
        enabled: selectedPhase !== null,
        queryFn: () => GetWorkflowExecutionPhaseDetails(selectedPhase!)
    })

    const isRunning = query.data?.status === WorkflowExecutionStatus.RUNNING
    const duration = DatesToDurationString(query.data?.completedAt, query.data?.startedAt);

    const creditsConsumed = GetPhasesTotalCost(query.data?.phases || [])

    return (
        <div className="flex w-full h-full">
            <aside className="w-[440px] min-w-[440px] max-w-[440px] 
            border-r-2 border-separate flex flex-grow flex-col overflow-hidden">
                <div className="py-4 px-2">
                    {/* Labels */}
                    <ExecutionLabel icon={CircleDashedIcon} label="Status" value={query.data?.status} Case="capitalize"/>
                    <ExecutionLabel icon={CalendarIcon} label="Started At" Case="lowercase"
                      value={
                        query.data?.startedAt 
                        ? formatDistanceToNow(new Date(query.data?.startedAt), {addSuffix: true, includeSeconds: true}) 
                        : "-"
                        }
                    />
                    <ExecutionLabel icon={ClockIcon} label="Duration" Case="capitalize" 
                      value={
                        duration 
                        ? duration 
                        : <Loader2Icon className="animate-spin" size={20}/>}
                    />
                    <ExecutionLabel icon={CoinsIcon} label="Credits Consumed" Case="capitalize" 
                      value={creditsConsumed}
                    />
                </div>
                <Separator />
                <div className="flex justify-center items-center py-2 px-4">
                    <div className="text-muted-foreground flex items-center gap-2">
                        <WorkflowIcon size={20} className="stroke-muted-foreground/80"/>
                        <span className="font-semibold">
                            Phases
                        </span>
                    </div>
                </div>
                <Separator />
                <div className="overflow-auto h-full px-2 py-4">
                    {query.data?.phases.map((phase, index) => (
                        <Button 
                          key={index} 
                          className="w-full justify-between" 
                          variant={selectedPhase === phase.id ? "secondary" : "ghost"}
                          onClick={() => {
                            if (isRunning) {return};
                            setSelectedPhase(phase.id);
                          }}
                        >
                            <div className="flex items-center gap-2">
                                <Badge variant={"outline"}>
                                    {index+1}
                                </Badge>
                                <p className="font-semibold">{phase.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {phase.status}
                            </p>
                        </Button>
                    ))}
                </div>
            </aside>
            <div className="flex w-full h-full">
                {isRunning && (
                    <div className="flex items-center flex-col gap-2 justify-center h-full w-full">
                        <p className="font-bold">
                            Run is in progress...
                        </p>
                    </div>
                )}
                {!isRunning && !selectedPhase && (
                    <div className="flex items-center flex-col gap-2 justify-center h-full w-full">
                        <div className="flex flex-col gap-1 text-center">
                            <p className="font-bold">No Phase selected</p>
                            <p className="text-sm text-muted-foreground">
                                Select a phase to view details
                            </p>
                        </div>
                    </div>
                )}
                {!isRunning && selectedPhase && phaseDetails.data && (
                    <div className="flex flex-col py-4 container gap-4 overflow-auto">
                        <div className="flex gap-2 items-center">
                            <Badge variant={"outline"} className="space-x-4">
                                <div className="flex gap-1 items-center">
                                    <CoinsIcon size={18} className="stroke-muted-foreground" />
                                    <span>Credits</span>
                                </div>
                                <span>TODO</span>
                            </Badge>
                            <Badge variant={"outline"} className="space-x-4">
                                <div className="flex gap-1 items-center">
                                    <ClockIcon size={18} className="stroke-muted-foreground" />
                                    <span>Duration</span>
                                </div>
                                <span>
                                    {DatesToDurationString(
                                        phaseDetails.data.completedAt, 
                                        phaseDetails.data.startedAt) || "-"}
                                </span>
                            </Badge>
                        </div>
                        <ParameterViewer 
                          title="Inputs"
                          subTitle="Inputs used for this phase"
                          paramsJSON={phaseDetails.data.inputs}
                        />
                        <ParameterViewer 
                          title="Outputs"
                          subTitle="Outputs generated by this phase"
                          paramsJSON={phaseDetails.data.outputs}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

function ExecutionLabel(
    {icon, label, value, Case} : 
    { icon: LucideIcon; label: ReactNode; value: ReactNode; Case: string }
) {
    const Icon = icon;
    return (
        <div className="flex justify-between items-center py-2 px-4 text-sm">
            <div className="text-muted-foreground flex items-center gap-2">
                <Icon size={20} className="stroke-muted-foreground/80"/>
                <span>{label}</span>
            </div>
            <div className={cn("font-semibold flex gap-2 items-center", Case)}>
                {value}
            </div>
        </div>
    )
}

function ParameterViewer({title, subTitle, paramsJSON} : {
    title: string;
    subTitle: string;
    paramsJSON : string | null;
}) {
    const parameters = paramsJSON ? JSON.parse(paramsJSON) : undefined;

    return (
        <Card>
            <CardHeader className="rounded-lg rounded-b-none border-b py-4 bg-gray-50 dark:bg-background">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-muted-foreground text-sm ">
                    {subTitle}
                </CardDescription>
            </CardHeader>
            <CardContent className="py-4">
                <div className="flex flex-col gap-2">
                    {(!parameters || Object.keys(parameters).length) === 0 && (
                        <p className="text-sm ">
                            No parameters generated by this phase.
                        </p>
                    )}
                    {parameters && Object.entries(parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center space-y-1">
                            <p className="text-sm text-muted-foreground flex-1 basis-1/3">
                              {key}
                            </p>
                            <Input 
                              readOnly 
                              className="flex-1 basis-2/3" 
                              value={value as string}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}