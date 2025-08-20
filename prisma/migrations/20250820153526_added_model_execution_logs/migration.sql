-- CreateTable
CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionPhaseId" TEXT NOT NULL,
    "logLevel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExecutionLog_executionPhaseId_fkey" FOREIGN KEY ("executionPhaseId") REFERENCES "ExecutionPhase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
