import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type LogLevel = "error" | "warn" | "info";
type LogSource = "webhook" | "payout" | "dispute" | "payment" | "email" | "auth" | "system";

export async function logEvent(params: {
  level: LogLevel;
  source: LogSource;
  message: string;
  details?: Record<string, unknown>;
  reference?: string;
}) {
  if (process.env.NODE_ENV !== "production") {
    const prefix = `[${params.level.toUpperCase()}][${params.source}]`;
    console.log(prefix, params.message, params.reference ?? "", params.details ?? "");
  }

  try {
    await prisma.appLog.create({
      data: {
        level: params.level,
        source: params.source,
        message: params.message,
        details: (params.details ?? {}) as Prisma.InputJsonValue,
        reference: params.reference,
      },
    });
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to write AppLog");
    }
  }
}
