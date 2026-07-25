import Anthropic from "@anthropic-ai/sdk";
import type { TradeRecord } from "@/types";
import { config } from "@/lib/config";

export async function summarizeMarket(params: {
  question: string | null;
  slug: string;
  trades: TradeRecord[];
}): Promise<string> {
  const key = config.anthropicApiKey;
  if (!key) {
    return fallbackSummary(params);
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const sample = params.trades.slice(0, 12).map((t) => ({
      side: t.side,
      price: t.price,
      size: t.size,
      outcome: t.outcome,
      timestamp: t.timestamp,
    }));

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      messages: [
        {
          role: "user",
          content: [
            "Write a 2-3 sentence Polymarket intelligence summary for a paid report.",
            "Be concrete about recent trade activity. No hype. No disclaimers.",
            `Market: ${params.question ?? params.slug}`,
            `Slug: ${params.slug}`,
            `Trade count in sample: ${params.trades.length}`,
            `Recent trades JSON: ${JSON.stringify(sample)}`,
          ].join("\n"),
        },
      ],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return text || fallbackSummary(params);
  } catch {
    return fallbackSummary(params);
  }
}

function fallbackSummary(params: {
  question: string | null;
  slug: string;
  trades: TradeRecord[];
}): string {
  const label = params.question ?? params.slug;
  if (params.trades.length === 0) {
    return `Resolved market "${label}" with no recent public trades in the requested window.`;
  }
  return `Resolved market "${label}" with ${params.trades.length} recent public trade(s) returned for review.`;
}
