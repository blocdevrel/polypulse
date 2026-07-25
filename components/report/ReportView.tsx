"use client";

import type { ReportResponse, TradeRecord } from "@/types";
import { MAX_TRADES_SHOWN } from "./constants";

export function ReportView({ report }: { report: ReportResponse }) {
  const visibleTrades = report.trades.slice(
    0,
    Math.min(MAX_TRADES_SHOWN, report.limit),
  );

  return (
    <section className="pp-report" aria-label="Intelligence report">
      <article className="pp-sheet">
        <span className="pp-section-label">Market</span>
        <h2>{report.slug}</h2>
        <div className="pp-chips">
          <span className="pp-chip pp-chip-mint">{report.count} trades</span>
          <span className="pp-chip pp-chip-sky">limit {report.limit}</span>
          <span className="pp-chip">
            {new Date(report.timestamp).toLocaleString()}
          </span>
        </div>
        <p className="pp-analysis">{report.analysis}</p>
      </article>

      <article className="pp-sheet">
        <span className="pp-section-label">Recent trades</span>
        {visibleTrades.length > 0 ? (
          <ul className="pp-trades">
            {visibleTrades.map((trade) => (
              <TradeRow key={trade.id} trade={trade} />
            ))}
          </ul>
        ) : (
          <p className="pp-analysis">No recent public trades in this window.</p>
        )}
      </article>
    </section>
  );
}

function TradeRow({ trade }: { trade: TradeRecord }) {
  const side = (trade.side || "?").toLowerCase();
  const sideClass = side.startsWith("b") ? "buy" : "sell";
  const sideLabel = (trade.side || "—").slice(0, 3);
  const when = trade.timestamp
    ? new Date(trade.timestamp).toLocaleString()
    : "—";
  const size = trade.size != null ? ` · size ${trade.size}` : "";

  return (
    <li className="pp-trade">
      <div className={`pp-trade-side ${sideClass}`}>{sideLabel}</div>
      <div className="pp-trade-main">
        <strong>{trade.outcome || "Trade"}</strong>
        <span>
          {when}
          {size}
        </span>
      </div>
      <div className="pp-trade-price">
        {trade.price != null ? trade.price.toFixed(3) : "—"}
      </div>
    </li>
  );
}
