export const REPORT_PRICE = formatReportPrice(
  process.env.NEXT_PUBLIC_REPORT_PRICE,
);

export const BTC_URL_EXAMPLE =
  "https://polymarket.com/event/btc-updown-15m-1780433100";

export const BTC_MARKET_PATTERN = /btc|bitcoin/i;

export const DEFAULT_TRADE_LIMIT = 20;
export const MIN_TRADE_LIMIT = 1;
export const MAX_TRADE_LIMIT = 100;
export const MAX_TRADES_SHOWN = 12;

function formatReportPrice(raw: string | undefined): string {
  const value = (raw || "0.05").replace(/^\$/, "").trim() || "0.05";
  return `$${value}`;
}
