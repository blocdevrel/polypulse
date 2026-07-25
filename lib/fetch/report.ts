import type { ReportResponse } from "@/types";

export type FetchReportResult =
  | { ok: true; report: ReportResponse }
  | { ok: false; status: number; error: string; paymentRequired: boolean };

/**
 * POST /api/report. When thirdweb client payment wrapper is available it can
 * replace this fetcher; for now we surface 402 so the UI can prompt pay/retry.
 */
export async function fetchReport(
  url: string,
  limit = 20,
  paymentHeader?: string | null,
): Promise<FetchReportResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (paymentHeader) {
    headers["X-PAYMENT"] = paymentHeader;
    headers["PAYMENT-SIGNATURE"] = paymentHeader;
  }

  const res = await fetch("/api/report", {
    method: "POST",
    headers,
    body: JSON.stringify({ url, limit }),
  });

  if (res.status === 402) {
    return {
      ok: false,
      status: 402,
      error: "Payment required to unlock this report.",
      paymentRequired: true,
    };
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    input?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data.error || `Request failed (${res.status})`,
      paymentRequired: false,
    };
  }

  return { ok: true, report: data as ReportResponse };
}
