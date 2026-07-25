import { listSettledReceipts } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(rawLimit) ? rawLimit : 50;
    const orders = await listSettledReceipts(limit);
    return Response.json({ orders, count: orders.length }, { status: 200 });
  } catch (err) {
    console.error("[api/orders]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const isConfig =
      message.startsWith("Missing required env:") ||
      message.includes("Environment variable not found") ||
      message.includes("Can't reach database") ||
      message.includes("does not exist in the current database");
    return Response.json(
      {
        error: isConfig
          ? "Database is not ready. Run npm run db:push after setting DATABASE_URL."
          : "Failed to load settled orders",
        detail: message,
      },
      { status: isConfig ? 503 : 500 },
    );
  }
}
