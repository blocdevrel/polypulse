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

export function resolveResourceUrl(request: Request): string {
  const configured = config.appUrl.replace(/\/$/, "");
  if (!/localhost|127\.0\.0\.1/i.test(configured)) {
    return `${configured}/api/report`;
  }

  const forwardedHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    ?.trim();
  const forwardedProto = (
    request.headers.get("x-forwarded-proto") || "https"
  )
    .split(",")[0]
    ?.trim();

  if (forwardedHost && !/localhost|127\.0\.0\.1/i.test(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}/api/report`;
  }

  try {
    const url = new URL(request.url);
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return `${url.origin}/api/report`;
    }
  } catch {
  }

  return `${configured}/api/report`;
}

export async function settleReportPayment(
  paymentData: string | null,
  resourceUrl: string,
): Promise<PaymentSettleOk | PaymentRequired> {
  const { facilitator: thirdwebFacilitator } = getPaymentStack();

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

  const anyResult = result as {
    response?: Response;
    responseBody?: unknown;
    responseHeaders?: Record<string, string>;
    status: number;
  };

  if (anyResult.response instanceof Response) {
    return { kind: "required", response: anyResult.response };
  }

  const headers = new Headers(anyResult.responseHeaders);
  if (!headers.has("Access-Control-Expose-Headers")) {
    headers.set(
      "Access-Control-Expose-Headers",
      "PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE",
    );
  }

  const body = anyResult.responseBody;
  const hasBody =
    body !== undefined &&
    body !== null &&
    !(
      typeof body === "object" &&
      !Array.isArray(body) &&
      Object.keys(body as object).length === 0
    );

  return {
    kind: "required",
    response: new Response(hasBody ? JSON.stringify(body) : null, {
      status: anyResult.status || 402,
      headers: {
        ...Object.fromEntries(headers.entries()),
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
    }),
  };
}

export function hashPaymentData(paymentData: string): string {
  return createHash("sha256").update(paymentData).digest("hex");
}
