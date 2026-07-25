import { AppError } from "@/types";
import {
  conditionIdOf,
  fetchEventBySlug,
  fetchMarketBySlug,
  type GammaMarket,
} from "./gamma";

export type ResolvedMarket = {
  input: string;
  slug: string;
  conditionId: string;
  question: string | null;
  market: GammaMarket;
};

/** Extract Polymarket slug from a full URL or accept a bare slug. */
export function extractSlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const u = new URL(trimmed);
      const parts = u.pathname.split("/").filter(Boolean);
      // /event/<slug> or /market/<slug>
      const eventIdx = parts.findIndex((p) => p === "event" || p === "market");
      if (eventIdx >= 0 && parts[eventIdx + 1]) {
        return decodeURIComponent(parts[eventIdx + 1]!);
      }
      if (parts.length > 0) {
        return decodeURIComponent(parts[parts.length - 1]!);
      }
      return null;
    }
  } catch {
    return null;
  }

  // Bare slug: allow alphanumerics, hyphens, underscores
  if (/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,200}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export async function resolveMarket(input: string): Promise<ResolvedMarket> {
  const slug = extractSlug(input);
  if (!slug) {
    throw new AppError("Invalid Polymarket URL or slug", 400, "INVALID_INPUT");
  }

  const direct = await fetchMarketBySlug(slug);
  if (direct) {
    const conditionId = conditionIdOf(direct);
    if (conditionId) {
      return {
        input,
        slug: direct.slug || slug,
        conditionId,
        question: direct.question ?? null,
        market: direct,
      };
    }
  }

  const event = await fetchEventBySlug(slug);
  const markets = event?.markets ?? [];
  for (const market of markets) {
    const conditionId = conditionIdOf(market);
    if (conditionId) {
      return {
        input,
        slug: market.slug || event?.slug || slug,
        conditionId,
        question: market.question ?? null,
        market,
      };
    }
  }

  throw new AppError(
    `Could not resolve market for "${slug}"`,
    400,
    "MARKET_NOT_FOUND",
  );
}
