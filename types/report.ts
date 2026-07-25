import { z } from "zod";

export const reportRequestSchema = z.object({
  url: z.string().min(1, "url is required"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ReportRequest = z.infer<typeof reportRequestSchema>;

export type TradeRecord = {
  id: string;
  side: string | null;
  price: number | null;
  size: number | null;
  timestamp: string | null;
  outcome: string | null;
};

export type ReportResponse = {
  input: string;
  slug: string;
  condition_id: string;
  limit: number;
  count: number;
  trades: TradeRecord[];
  positions: unknown[];
  analysis: string;
  timestamp: string;
};

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
