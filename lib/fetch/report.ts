import type { ReportResponse } from "@/types";
import { hasEthereumProvider, isMiniPay } from "@/lib/minipay";
import { wrapFetchWithMiniPayPayment } from "@/lib/fetch/x402-client";

export type FetchReportResult =
  | { ok: true; report: ReportResponse }
  | { ok: false; status: number; error: string; paymentRequired: boolean };

function friendlyPaymentError(err: unknown): {
  message: string;
  cancelled: boolean;
  paymentRequired: boolean;
} {
  const message = err instanceof Error ? err.message : "Payment failed";
  const cancelled =
    /reject|cancel|denied|user rejected/i.test(message) ||
    (err as { code?: number })?.code === 4001;

  if (cancelled) {
    return {
      message: "Payment cancelled in MiniPay. Tap Get report to try again.",
      cancelled: true,
      paymentRequired: false,
    };
  }

  if (/status:\s*403/i.test(message) || /\b403\b/.test(message)) {
    return {
      message:
        "Wallet RPC was blocked (403). Retry in MiniPay — PolyPulse signs payments locally without thirdweb browser RPC.",
      cancelled: false,
      paymentRequired: true,
    };
  }

  if (!isMiniPay() && !hasEthereumProvider()) {
    return {
      message: "Open PolyPulse inside MiniPay to approve the USDC payment.",
      cancelled: false,
      paymentRequired: true,
    };
  }

  return { message, cancelled: false, paymentRequired: true };
}

function getPayFetch(): typeof fetch {
  if (!hasEthereumProvider()) return fetch;
  return wrapFetchWithMiniPayPayment(fetch, { maxValue: BigInt(100_000) });
}

export async function fetchReport(
  url: string,
  limit = 20,
): Promise<FetchReportResult> {
  let res: Response;
  try {
    res = await getPayFetch()("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, limit }),
    });
  } catch (err) {
    const friendly = friendlyPaymentError(err);
    return {
      ok: false,
      status: friendly.cancelled ? 400 : 500,
      error: friendly.message,
      paymentRequired: friendly.paymentRequired,
    };
  }

  if (res.status === 402) {
    let detail = "";
    try {
      const body = (await res.clone().json()) as {
        error?: string;
        errorMessage?: string;
      };
      detail = body.errorMessage || body.error || "";
    } catch {
    }

    return {
      ok: false,
      status: 402,
      error: isMiniPay()
        ? detail ||
          "Payment still required — fund USDC on Celo in MiniPay and try again."
        : "Open PolyPulse inside MiniPay to approve the USDC payment.",
      paymentRequired: true,
    };
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    detail?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data.error || data.detail || `Request failed (${res.status})`,
      paymentRequired: false,
    };
  }

  return { ok: true, report: data as ReportResponse };
}
