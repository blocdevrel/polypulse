import { createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import { facilitator, settlePayment } from "thirdweb/x402";
import { createHash } from "crypto";
import { config } from "@/lib/config";

export type PaymentSettleOk = {
  kind: "settled";
  status: 200;
  paymentReceipt: unknown;
  responseHeaders: Record<string, string>;
};

export type PaymentRequired = {
  kind: "required";
  response: Response;
};

let cached:
  | {
      client: ReturnType<typeof createThirdwebClient>;
      facilitator: ReturnType<typeof facilitator>;
    }
  | undefined;

function getPaymentStack() {
  if (!cached) {
    const client = createThirdwebClient({
      secretKey: config.clientSecret,
      ...(config.clientId ? { clientId: config.clientId } : {}),
    });
    cached = {
      client,
      facilitator: facilitator({
        client,
        serverWalletAddress: config.serverWallet,
      }),
    };
  }
  return cached;
}

export async function settleReportPayment(
  paymentData: string | null,
): Promise<PaymentSettleOk | PaymentRequired> {
  const { facilitator: thirdwebFacilitator } = getPaymentStack();
  const resourceUrl = `${config.appUrl}/api/report`;

  const result = await settlePayment({
    resourceUrl,
    method: "POST",
    paymentData: paymentData ?? undefined,
    payTo: config.payToWallet,
    network: celo,
    price: config.reportPrice,
    facilitator: thirdwebFacilitator,
    routeConfig: {
      description: "Polymarket market intelligence report",
      mimeType: "application/json",
    },
  });

  if (result.status === 200) {
    return {
      kind: "settled",
      status: 200,
      paymentReceipt: result.paymentReceipt,
      responseHeaders: result.responseHeaders ?? {},
    };
  }

  // Prefer SDK-provided Response when present; otherwise reconstruct 402.
  const anyResult = result as {
    response?: Response;
    responseBody?: unknown;
    responseHeaders?: Record<string, string>;
    status: number;
  };

  if (anyResult.response instanceof Response) {
    return { kind: "required", response: anyResult.response };
  }

  return {
    kind: "required",
    response: Response.json(anyResult.responseBody ?? { error: "Payment Required" }, {
      status: anyResult.status || 402,
      headers: anyResult.responseHeaders,
    }),
  };
}

/** Deterministic key from raw payment header when needed. */
export function hashPaymentData(paymentData: string): string {
  return createHash("sha256").update(paymentData).digest("hex");
}
