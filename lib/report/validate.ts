import { AppError, reportRequestSchema, type ReportRequest } from "@/types";

export function parseReportRequest(body: unknown): ReportRequest {
  const parsed = reportRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    throw new AppError(message || "Invalid request body", 400, "INVALID_BODY");
  }
  return parsed.data;
}
