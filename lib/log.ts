import { Log, LogCollector, LogFunction, LogLevel, LogLevels } from "@/types/log";

export function createLogCollector() : LogCollector {
    const logs : Log[] = [];
    const getAll = () => logs;

    const logFunctions = {} as Record<LogLevel, LogFunction>;
    LogLevels.forEach(
        (logLevel) => logFunctions[logLevel] = (message : string) => 
            logs.push({message : message, level : logLevel,timestamp : new Date() })
    );
    
    return {
        getAll,
        ...logFunctions
    };
}