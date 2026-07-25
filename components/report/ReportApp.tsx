"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ReportResponse, TradeRecord } from "@/types";
import { connectHostWallet, isMiniPay } from "@/lib/minipay";
import { fetchReport } from "@/lib/fetch/report";

function formatPrice(raw: string | undefined): string {
  const value = (raw || "0.05").replace(/^\$/, "").trim() || "0.05";
  return `$${value}`;
}

const PRICE = formatPrice(process.env.NEXT_PUBLIC_REPORT_PRICE);
const BTC_URL_EXAMPLE =
  "https://polymarket.com/event/btc-updown-15m-1780433100";
const BTC_HINT = /btc|bitcoin/i;

type Phase = "idle" | "loading" | "payment" | "done" | "error";

export function ReportApp() {
  const [url, setUrl] = useState("");
  const [limit, setLimit] = useState(20);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [miniPay, setMiniPay] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const mini = isMiniPay();
    setMiniPay(mini);
    if (!mini) return;
    void connectHostWallet()
      .then((addr) => setAddress(addr))
      .catch(() => setAddress(null));
  }, []);

  const live = useMemo(() => {
    if (miniPay && address) {
      return {
        className: "pp-live",
        text: `MiniPay · ${shorten(address)}`,
      };
    }
    if (miniPay) {
      return { className: "pp-live", text: "MiniPay connected" };
    }
    if (address) {
      return { className: "pp-live", text: shorten(address) };
    }
    return { className: "pp-live is-idle", text: "Ready when you are" };
  }, [miniPay, address]);

  function runReport() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a Polymarket BTC event URL or market slug.");
      setPhase("error");
      return;
    }
    if (!BTC_HINT.test(trimmed)) {
      setError(
        "PolyPulse currently supports BTC markets only. Use a BTC Up/Down URL or slug.",
      );
      setPhase("error");
      return;
    }

    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));

    setError(null);
    setReport(null);
    setPhase("loading");

    startTransition(async () => {
      const result = await fetchReport(trimmed, safeLimit);
      if (result.ok) {
        setReport(result.report);
        setPhase("done");
        return;
      }
      if (result.paymentRequired) {
        setPhase("payment");
        setError(null);
        return;
      }
      setError(result.error);
      setPhase("error");
    });
  }

  async function connectDesktop() {
    try {
      const addr = await connectHostWallet();
      setAddress(addr);
    } catch {
      setError("Could not connect wallet.");
      setPhase("error");
    }
  }

  const busy = pending || phase === "loading";
  const showConnect = !miniPay && !address;
  const stageClass = report ? "pp-stage has-report" : "pp-stage";
  const publicAppUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const isLocalApp =
    !publicAppUrl ||
    publicAppUrl.includes("localhost") ||
    publicAppUrl.includes("127.0.0.1");
  const miniPayBrowseUrl =
    !isLocalApp && publicAppUrl
      ? `https://link.minipay.xyz/browse?url=${encodeURIComponent(publicAppUrl)}`
      : null;

  return (
    <div className={stageClass}>
      <header className="pp-hero">
        <div className="pp-logo">
          <span className="pp-orb" aria-hidden />
          <h1 className="pp-wordmark">PolyPulse</h1>
        </div>
        <p className="pp-tagline">
          BTC Up/Down intelligence. Pay once in USDC. Read the pulse.
        </p>
      </header>

      <form
        className="pp-order"
        onSubmit={(e) => {
          e.preventDefault();
          runReport();
        }}
      >
        <div className="pp-order-head">
          <span className="pp-order-kicker">Order Details</span>
          <h2 className="pp-order-title">PolyPulse · BTC Recent Trades</h2>
        </div>

        <div className="pp-order-field">
          <div className="pp-order-label-row">
            <label htmlFor="market-url">
              Url<span aria-hidden>*</span>
            </label>
            <button
              type="button"
              className="pp-linkish"
              disabled={busy}
              onClick={() => setUrl(BTC_URL_EXAMPLE)}
            >
              Use example
            </button>
          </div>
          <p className="pp-order-hint" id="market-url-hint">
            Polymarket BTC event URL or market slug.
          </p>
          <input
            id="market-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={BTC_URL_EXAMPLE}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            aria-describedby="market-url-hint"
            required
          />
        </div>

        <div className="pp-order-row">
          <div className="pp-order-field">
            <label htmlFor="trade-limit">
              Limit<span aria-hidden>*</span>
            </label>
            <p className="pp-order-hint" id="trade-limit-hint">
              Max recent trades.
            </p>
            <input
              id="trade-limit"
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              disabled={busy}
              aria-describedby="trade-limit-hint"
              required
            />
          </div>

          <div className="pp-order-field">
            <span className="pp-order-label" id="order-price-label">
              Price
            </span>
            <p className="pp-order-hint">USDC · pay once</p>
            <div
              className="pp-price-value"
              aria-labelledby="order-price-label"
            >
              {PRICE}
            </div>
          </div>
        </div>

        <button type="submit" className="pp-cta" disabled={busy}>
          <span>{busy ? "Working…" : "Get report"}</span>
          <span className="pp-cta-price">{PRICE}</span>
        </button>

        <div className="pp-meta-row">
          <span className={live.className}>
            <i aria-hidden />
            {live.text}
          </span>
          {showConnect ? (
            <button
              type="button"
              className="pp-linkish"
              onClick={() => void connectDesktop()}
              disabled={busy}
            >
              Connect wallet
            </button>
          ) : null}
        </div>

        {phase === "payment" ? (
          <div className="pp-banner pp-banner-pay" role="status">
            {miniPay ? (
              <>
                MiniPay is connected. Approve the USDC x402 charge when prompted,
                then tap Get report again.
              </>
            ) : (
              <>
                <strong>Payment required ({PRICE} USDC).</strong> MiniPay is not
                available in this browser — open PolyPulse inside the MiniPay
                app to pay.
                {miniPayBrowseUrl ? (
                  <>
                    {" "}
                    <a className="pp-inline-link" href={miniPayBrowseUrl}>
                      Open in MiniPay
                    </a>
                  </>
                ) : (
                  <>
                    {" "}
                    Expose this app with a public HTTPS URL (ngrok), set{" "}
                    <code>NEXT_PUBLIC_APP_URL</code>, then open it via MiniPay
                    Developer Settings → Load Test Page.
                  </>
                )}
              </>
            )}
          </div>
        ) : null}

        {error && phase === "error" ? (
          <div className="pp-banner pp-banner-err" role="alert">
            {error}
          </div>
        ) : null}
      </form>

      {report ? <ReportView report={report} /> : null}
    </div>
  );
}

function ReportView({ report }: { report: ReportResponse }) {
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
        {report.trades.length > 0 ? (
          <ul className="pp-trades">
            {report.trades.slice(0, Math.min(12, report.limit)).map((trade) => (
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

  return (
    <li className="pp-trade">
      <div className={`pp-trade-side ${sideClass}`}>
        {(trade.side || "—").slice(0, 3)}
      </div>
      <div className="pp-trade-main">
        <strong>{trade.outcome || "Trade"}</strong>
        <span>
          {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : "—"}
          {trade.size != null ? ` · size ${trade.size}` : ""}
        </span>
      </div>
      <div className="pp-trade-price">
        {trade.price != null ? trade.price.toFixed(3) : "—"}
      </div>
    </li>
  );
}

function shorten(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
