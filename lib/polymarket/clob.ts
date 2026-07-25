import type { TradeRecord } from "@/types";
import { fetchJson } from "./http";

const CLOB = "https://clob.polymarket.com";

type ClobTrade = {
  id?: string;
  side?: string;
  price?: string | number;
  size?: string | number;
  timestamp?: string | number;
  match_time?: string | number;
  outcome?: string;
  asset_id?: string;
};

function toNumber(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIso(value: string | number | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    const ms = value > 1e12 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  const asNum = Number(value);
  if (Number.isFinite(asNum) && /^\d+$/.test(value)) {
    const ms = asNum > 1e12 ? asNum : asNum * 1000;
    return new Date(ms).toISOString();
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function fetchRecentTrades(
  conditionId: string,
  limit: number,
): Promise<TradeRecord[]> {
  const url = `${CLOB}/trades?market=${encodeURIComponent(conditionId)}&limit=${limit}`;
  try {
    const raw = await fetchJson<ClobTrade[]>(url);
    if (!Array.isArray(raw)) return [];

    return raw.slice(0, limit).map((t, index) => ({
      id: t.id ?? `${conditionId}-${index}`,
      side: t.side ?? null,
      price: toNumber(t.price),
      size: toNumber(t.size),
      timestamp: toIso(t.timestamp ?? t.match_time),
      outcome: t.outcome ?? null,
    }));
  } catch {
    // Public CLOB trade filters vary; empty is a valid deliverable.
    return [];
  }
}
