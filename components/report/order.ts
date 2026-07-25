import {
  BTC_MARKET_PATTERN,
  DEFAULT_TRADE_LIMIT,
  MAX_TRADE_LIMIT,
  MIN_TRADE_LIMIT,
} from "./constants";

export type OrderInput = {
  url: string;
  limit: number;
};

export type OrderValidation =
  | { ok: true; url: string; limit: number }
  | { ok: false; error: string };

export function clampTradeLimit(limit: number): number {
  const n = Math.floor(Number.isFinite(limit) ? limit : DEFAULT_TRADE_LIMIT);
  return Math.min(MAX_TRADE_LIMIT, Math.max(MIN_TRADE_LIMIT, n || DEFAULT_TRADE_LIMIT));
}

export function validateOrderInput(input: OrderInput): OrderValidation {
  const url = input.url.trim();
  if (!url) {
    return {
      ok: false,
      error: "Paste a Polymarket BTC event URL or market slug.",
    };
  }
  if (!BTC_MARKET_PATTERN.test(url)) {
    return {
      ok: false,
      error:
        "PolyPulse currently supports BTC markets only. Use a BTC Up/Down URL or slug.",
    };
  }
  return { ok: true, url, limit: clampTradeLimit(input.limit) };
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function resolveMiniPayBrowseUrl(
  appUrl = process.env.NEXT_PUBLIC_APP_URL,
): string | null {
  const base = appUrl?.replace(/\/$/, "") || "";
  if (!base || /localhost|127\.0\.0\.1/i.test(base)) return null;
  return `https://link.minipay.xyz/browse?url=${encodeURIComponent(base)}`;
}

export type WalletStatus = {
  className: string;
  label: string;
};

export function getWalletStatus(
  miniPay: boolean,
  address: string | null,
): WalletStatus {
  if (miniPay && address) {
    return {
      className: "pp-live",
      label: `MiniPay · ${shortenAddress(address)}`,
    };
  }
  if (miniPay) {
    return { className: "pp-live", label: "MiniPay · connecting…" };
  }
  if (address) {
    return { className: "pp-live", label: shortenAddress(address) };
  }
  return {
    className: "pp-live is-idle",
    label: "Ready when you are",
  };
}
