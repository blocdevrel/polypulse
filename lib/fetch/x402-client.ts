import {
  createWalletClient,
  custom,
  getAddress,
  type Address,
  type Hex,
  type WalletClient,
} from "viem";
import { celo } from "viem/chains";
import {
  createMiniPayWalletClient,
  getEthereumProvider,
  hasEthereumProvider,
} from "@/lib/minipay";

type PaymentRequirements = {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
  extra?: {
    name?: string;
    version?: string;
    primaryType?: string;
    recipientAddress?: string;
  };
};

type PaymentRequiredPayload = {
  x402Version?: number;
  error?: string;
  accepts?: PaymentRequirements[];
};

const CELO_CHAIN_ID_HEX = `0x${celo.id.toString(16)}` as Hex;

function b64encode(data: string): string {
  return globalThis.btoa(data);
}

function b64decode(data: string): string {
  return globalThis.atob(data);
}

function randomNonce(): Hex {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}` as Hex;
}

function parseChainId(network: string): number {
  const caip = network.match(/^eip155:(\d+)$/i);
  if (caip) return Number(caip[1]);
  const bare = Number(network);
  if (Number.isFinite(bare)) return bare;
  throw new Error(`Unsupported payment network: ${network}`);
}

async function ensureCelo(wallet: WalletClient): Promise<void> {
  const provider = getEthereumProvider();
  try {
    const current = await wallet.getChainId();
    if (current === celo.id) return;
  } catch {
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CELO_CHAIN_ID_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CELO_CHAIN_ID_HEX,
            chainName: "Celo",
            nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
            rpcUrls: ["https://forno.celo.org"],
            blockExplorerUrls: ["https://celoscan.io"],
          },
        ],
      });
      return;
    }
    throw err;
  }
}

async function connectSigner(): Promise<{
  wallet: WalletClient;
  address: Address;
}> {
  if (!hasEthereumProvider()) {
    throw new Error("Open PolyPulse inside MiniPay to approve the USDC payment.");
  }

  const bootstrap = createMiniPayWalletClient();
  let address: Address | undefined;
  try {
    address = (await bootstrap.requestAddresses())[0];
  } catch {
    address = (await bootstrap.getAddresses())[0];
  }
  if (!address) {
    throw new Error("MiniPay did not return an account. Unlock MiniPay and retry.");
  }

  const wallet = createWalletClient({
    account: address,
    chain: celo,
    transport: custom(getEthereumProvider() as never),
  });

  await ensureCelo(wallet);
  return { wallet, address };
}

function pickRequirements(
  accepts: PaymentRequirements[],
  maxValue: bigint,
): PaymentRequirements {
  if (!accepts.length) {
    throw new Error("402 response has no usable x402 payment requirements.");
  }

  const matching =
    accepts.find((a) => {
      try {
        return parseChainId(a.network) === celo.id;
      } catch {
        return false;
      }
    }) ?? accepts[0]!;

  if (BigInt(matching.maxAmountRequired) > maxValue) {
    throw new Error(
      `Payment amount exceeds maximum allowed (${maxValue} base units).`,
    );
  }

  return matching;
}

function readPaymentRequired(res: Response): PaymentRequiredPayload {
  const header =
    res.headers.get("payment-required") ||
    res.headers.get("PAYMENT-REQUIRED");

  if (header) {
    return JSON.parse(b64decode(header)) as PaymentRequiredPayload;
  }

  throw new Error(
    "402 response missing payment-required header — cannot open approval.",
  );
}

async function signExactPayment(
  wallet: WalletClient,
  from: Address,
  req: PaymentRequirements,
  x402Version: number,
): Promise<string> {
  const primaryType = req.extra?.primaryType || "TransferWithAuthorization";
  if (primaryType !== "TransferWithAuthorization") {
    throw new Error(
      `Unsupported payment signature type: ${primaryType}. Expected TransferWithAuthorization.`,
    );
  }

  const name = req.extra?.name || "USDC";
  const version = req.extra?.version || "2";
  const chainId = parseChainId(req.network);
  const validAfter = BigInt(Math.floor(Date.now() / 1000) - 86_400);
  const validBefore = BigInt(
    Math.floor(Date.now() / 1000) + (req.maxTimeoutSeconds || 86_400),
  );
  const nonce = randomNonce();
  const facilitatorPayTo = getAddress(req.payTo);
  const fromChecksummed = getAddress(from);
  const asset = getAddress(req.asset);
  const value = BigInt(req.maxAmountRequired);

  const signature = await wallet.signTypedData({
    account: fromChecksummed,
    domain: {
      name,
      version,
      chainId,
      verifyingContract: asset,
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: {
      from: fromChecksummed,
      to: facilitatorPayTo,
      value,
      validAfter,
      validBefore,
      nonce,
    },
  });

  return b64encode(
    JSON.stringify({
      x402Version,
      scheme: req.scheme,
      network: req.network,
      payload: {
        signature,
        authorization: {
          from: fromChecksummed,
          to: facilitatorPayTo,
          value: value.toString(),
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    }),
  );
}

export function wrapFetchWithMiniPayPayment(
  baseFetch: typeof fetch,
  options?: { maxValue?: bigint },
): typeof fetch {
  const maxValue = options?.maxValue ?? BigInt(100_000);

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const first = await baseFetch(input, init);
    if (first.status !== 402) return first;

    const required = readPaymentRequired(first);
    const selected = pickRequirements(required.accepts ?? [], maxValue);
    const { wallet, address } = await connectSigner();
    const paymentHeader = await signExactPayment(
      wallet,
      address,
      selected,
      required.x402Version ?? 2,
    );

    const headers = new Headers(init?.headers);
    headers.set("PAYMENT-SIGNATURE", paymentHeader);
    headers.set("X-PAYMENT", paymentHeader);

    return baseFetch(input, { ...init, headers });
  }) as typeof fetch;
}
