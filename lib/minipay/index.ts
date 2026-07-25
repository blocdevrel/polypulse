export type MiniPayProvider = {
  isMiniPay?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: MiniPayProvider;
  }
}

export function isMiniPay(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.ethereum?.isMiniPay);
}

export async function connectHostWallet(): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  return accounts[0] ?? null;
}

export function walletLabel(address: string | null, miniPay: boolean): string {
  if (miniPay && address) {
    return `MiniPay · ${shorten(address)}`;
  }
  if (address) return shorten(address);
  if (miniPay) return "MiniPay detected";
  return "Desktop wallet optional";
}

function shorten(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
