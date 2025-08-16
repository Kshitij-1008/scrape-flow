import { intervalToDuration } from "date-fns";

export function DatesToDurationString(
    completedAt: Date | null | undefined, 
    startedAt: Date | null | undefined
) {
    if (!completedAt || !startedAt) {return null};

    const timeElapsed = completedAt.getTime() - startedAt.getTime()
    if (timeElapsed < 1000) {
        // Less than a second
        return `${timeElapsed}ms`;
    }

    const duration = intervalToDuration({
        start: 0,
        end: timeElapsed
    });
    
    return `${duration.minutes || 0}m ${duration.seconds || 0}s`
}