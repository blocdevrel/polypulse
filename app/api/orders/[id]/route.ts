import { findReceiptById } from "@/lib/db";
import type { ReportResponse } from "@/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Order id is required" }, { status: 400 });
    }

    const receipt = await findReceiptById(id);
    if (!receipt || receipt.status !== "completed" || !receipt.reportJson) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json(
      {
        id: receipt.id,
        slug: receipt.slug,
        input: receipt.input,
        status: receipt.status,
        createdAt: receipt.createdAt.toISOString(),
        report: receipt.reportJson as ReportResponse,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/orders/:id]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json(
      { error: "Failed to load order", detail: message },
      { status: 500 },
    );
  }
}
