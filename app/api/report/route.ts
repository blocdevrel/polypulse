import { AppError } from "@/types";
import { resolveResourceUrl } from "@/lib/payments/x402";
import { runReportPipeline } from "@/lib/report";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const paymentData =
      request.headers.get("PAYMENT-SIGNATURE") ||
      request.headers.get("PAYMENT-SIGNATURE".toLowerCase()) ||
      request.headers.get("X-PAYMENT") ||
      request.headers.get("x-payment");

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const resourceUrl = resolveResourceUrl(request);
    const result = await runReportPipeline(body, paymentData, resourceUrl);

    if (result.kind === "payment_required") {
      return result.response;
    }

    return Response.json(result.report, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }

    console.error("[api/report]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const isConfig =
      message.startsWith("Missing required env:") ||
      message.includes("Environment variable not found");
    const isPayment =
      /payment|facilitator|settle|x402|thirdweb/i.test(message);
    return Response.json(
      {
        error: isConfig
          ? "Server is missing payment/database configuration. Set Railway env vars and redeploy."
          : isPayment
            ? "Payment settlement failed. Check MiniPay USDC balance on Celo and try again."
            : "Internal server error",
        detail: message,
      },
      { status: isConfig ? 503 : 500 },
    );
  }
}
