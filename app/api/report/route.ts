import { AppError } from "@/types";
import { runReportPipeline } from "@/lib/report";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const paymentData =
      request.headers.get("PAYMENT-SIGNATURE") ||
      request.headers.get("X-PAYMENT");

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const result = await runReportPipeline(body, paymentData);

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
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
