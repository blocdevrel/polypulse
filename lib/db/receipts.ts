import type { Prisma } from "@prisma/client";
import type { ReportResponse } from "@/types";
import { prisma } from "./prisma";

export async function findCompletedReceipt(paymentKey: string) {
  return prisma.reportReceipt.findUnique({
    where: { paymentKey },
  });
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
