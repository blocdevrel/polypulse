import { createWalletClient, custom, type WalletClient } from "viem";
import { celo } from "viem/chains";

export type MiniPayProvider = {
  isMiniPay?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (...args: unknown[]) => void;
  removeListener?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    ethereum?: MiniPayProvider;
  }
}

export function isMiniPay(): boolean {
  if (typeof window === "undefined") return false;
  return window.ethereum?.isMiniPay === true;
}

export function getEthereumProvider(): MiniPayProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "window.ethereum is required. Please run this app inside MiniPay.",
    );
  }
  return window.ethereum;
}

export function hasEthereumProvider(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export function createMiniPayWalletClient(): WalletClient {
  return createWalletClient({
    chain: celo,
    transport: custom(getEthereumProvider() as never),
  });
}

export async function connectHostWallet(): Promise<string | null> {
  if (!hasEthereumProvider()) return null;

  try {
    const client = createMiniPayWalletClient();
    try {
      const requested = await client.requestAddresses();
      if (requested[0]) return requested[0];
    } catch {
    }
    const addresses = await client.getAddresses();
    return addresses[0] ?? null;
  } catch {
    return null;
  }
}
