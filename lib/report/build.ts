import { summarizeMarket } from "@/lib/analysis";
import {
  fetchRecentTrades,
  resolveMarket,
  type ResolvedMarket,
} from "@/lib/polymarket";
import type { ReportRequest, ReportResponse } from "@/types";

export async function buildReport(
  request: ReportRequest,
  preResolved?: ResolvedMarket,
): Promise<ReportResponse> {
  const resolved = preResolved ?? (await resolveMarket(request.url));
  const trades = await fetchRecentTrades(resolved.conditionId, request.limit);
  const analysis = await summarizeMarket({
    question: resolved.question,
    slug: resolved.slug,
    trades,
  });

  return {
    input: request.url,
    slug: resolved.slug,
    condition_id: resolved.conditionId,
    limit: request.limit,
    count: trades.length,
    trades,
    positions: [],
    analysis,
    timestamp: new Date().toISOString(),
  };
}
