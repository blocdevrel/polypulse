import type { Prisma } from "@prisma/client";
import type { ReportResponse, SettledOrderSummary } from "@/types";
import { prisma } from "./prisma";

function tradeCountFromReportJson(reportJson: unknown): number | null {
  if (!reportJson || typeof reportJson !== "object") return null;
  const count = (reportJson as { count?: unknown }).count;
  return typeof count === "number" && Number.isFinite(count) ? count : null;
}

export async function findCompletedReceipt(paymentKey: string) {
  return prisma.reportReceipt.findUnique({
    where: { paymentKey },
  });
}

export async function findReceiptById(id: string) {
  return prisma.reportReceipt.findUnique({
    where: { id },
  });
}

export async function listSettledReceipts(
  limit = 50,
): Promise<SettledOrderSummary[]> {
  const rows = await prisma.reportReceipt.findMany({
    where: { status: "completed" },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: {
      id: true,
      slug: true,
      input: true,
      status: true,
      createdAt: true,
      reportJson: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    input: row.input,
    status: "completed" as const,
    createdAt: row.createdAt.toISOString(),
    tradeCount: tradeCountFromReportJson(row.reportJson),
  }));
}

export async function beginReceipt(params: {
  paymentKey: string;
  input: string;
  slug: string;
  conditionId: string;
}) {
  return prisma.reportReceipt.upsert({
    where: { paymentKey: params.paymentKey },
    create: {
      paymentKey: params.paymentKey,
      input: params.input,
      slug: params.slug,
      conditionId: params.conditionId,
      status: "pending",
    },
    update: {},
  });
}

export async function completeReceipt(
  paymentKey: string,
  report: ReportResponse,
) {
  return prisma.reportReceipt.update({
    where: { paymentKey },
    data: {
      status: "completed",
      reportJson: report as unknown as Prisma.InputJsonValue,
      error: null,
    },
  });
}

export async function failReceipt(paymentKey: string, error: string) {
  return prisma.reportReceipt.update({
    where: { paymentKey },
    data: {
      status: "failed",
      error,
    },
  });
}
