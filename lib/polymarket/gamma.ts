import { fetchJson } from "./http";

const GAMMA = "https://gamma-api.polymarket.com";

export type GammaMarket = {
  id?: string;
  question?: string;
  slug?: string;
  conditionId?: string;
  condition_id?: string;
  clobTokenIds?: string | string[];
  outcomes?: string | string[];
  active?: boolean;
  closed?: boolean;
};

export async function fetchMarketBySlug(slug: string): Promise<GammaMarket | null> {
  const markets = await fetchJson<GammaMarket[]>(
    `${GAMMA}/markets?slug=${encodeURIComponent(slug)}`,
  );
  if (!Array.isArray(markets) || markets.length === 0) {
    return null;
  }
  return markets[0] ?? null;
}

export async function fetchEventBySlug(slug: string): Promise<{
  markets?: GammaMarket[];
  slug?: string;
} | null> {
  try {
    const events = await fetchJson<Array<{ markets?: GammaMarket[]; slug?: string }>>(
      `${GAMMA}/events?slug=${encodeURIComponent(slug)}`,
    );
    if (!Array.isArray(events) || events.length === 0) {
      return null;
    }
    return events[0] ?? null;
  } catch {
    return null;
  }
}

export function conditionIdOf(market: GammaMarket): string | null {
  const id = market.conditionId || market.condition_id;
  return id && typeof id === "string" && id.length > 0 ? id : null;
}
