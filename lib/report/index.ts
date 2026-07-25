import {
  beginReceipt,
  completeReceipt,
  failReceipt,
  findCompletedReceipt,
} from "@/lib/db";
import {
  hashPaymentData,
  settleReportPayment,
  type PaymentSettleOk,
} from "@/lib/payments/x402";
import { resolveMarket } from "@/lib/polymarket";
import type { ReportResponse } from "@/types";
import { buildReport } from "./build";
import { parseReportRequest } from "./validate";

export type ReportPipelineResult =
  | { kind: "ok"; report: ReportResponse }
  | { kind: "payment_required"; response: Response };

function paymentKeyFrom(
  settle: PaymentSettleOk,
  paymentData: string | null,
  input: string,
): string {
  const receipt = settle.paymentReceipt as {
    transaction?: string;
    txHash?: string;
    transactionHash?: string;
  } | null;

  const tx =
    receipt?.transaction ||
    receipt?.txHash ||
    receipt?.transactionHash ||
    null;

  if (tx) return `tx:${tx}`;
  if (paymentData) return `hdr:${hashPaymentData(paymentData)}`;
  return `pay:${hashPaymentData(`${input}:${JSON.stringify(receipt ?? {})}`)}`;
}

export async function runReportPipeline(
  body: unknown,
  paymentData: string | null,
): Promise<ReportPipelineResult> {
  const request = parseReportRequest(body);

  // Resolve before charging — invalid markets never hit x402.
  const resolved = await resolveMarket(request.url);

  const settle = await settleReportPayment(paymentData);
  if (settle.kind === "required") {
    return { kind: "payment_required", response: settle.response };
  }

  const paymentKey = paymentKeyFrom(settle, paymentData, request.url);
  const existing = await findCompletedReceipt(paymentKey);
  if (existing?.status === "completed" && existing.reportJson) {
    return {
      kind: "ok",
      report: existing.reportJson as unknown as ReportResponse,
    };
  }

  await beginReceipt({
    paymentKey,
    input: request.url,
    slug: resolved.slug,
    conditionId: resolved.conditionId,
  });

  try {
    const report = await buildReport(request, resolved);
    await completeReceipt(paymentKey, report);
    return { kind: "ok", report };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Report build failed";
    await failReceipt(paymentKey, message).catch(() => undefined);
    throw err;
  }
}

export { parseReportRequest } from "./validate";
export { buildReport } from "./build";
