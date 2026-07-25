"use client";

import { REPORT_PRICE, BTC_URL_EXAMPLE } from "./constants";
import { getWalletStatus, resolveMiniPayBrowseUrl } from "./order";
import { useReportApp } from "./useReportApp";
import { ReportView } from "./ReportView";

export function ReportApp() {
  const {
    url,
    setUrl,
    limit,
    setLimit,
    phase,
    error,
    report,
    miniPay,
    address,
    busy,
    showConnect,
    submitOrder,
    connectDesktopWallet,
  } = useReportApp();

  const wallet = getWalletStatus(miniPay, address);
  const miniPayBrowseUrl = resolveMiniPayBrowseUrl();
  const stageClass = report ? "pp-stage has-report" : "pp-stage";
  const ctaLabel = busy
    ? miniPay
      ? "Approve in MiniPay…"
      : "Working…"
    : "Get report";

  return (
    <div className={stageClass}>
      <section className="pp-order-page" aria-labelledby="order-heading">
        <form
          id="order"
          className="pp-order"
          onSubmit={(event) => {
            event.preventDefault();
            void submitOrder();
          }}
        >
          <div className="pp-order-head">
            <span className="pp-order-kicker">Order Details</span>
            <h1 id="order-heading" className="pp-order-title">
              PolyPulse · BTC Recent Trades
            </h1>
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
              onChange={(event) => setUrl(event.target.value)}
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
                onChange={(event) => setLimit(Number(event.target.value))}
                disabled={busy}
                aria-describedby="trade-limit-hint"
                required
              />
            </div>

            <div className="pp-order-field">
              <span className="pp-order-label" id="order-price-label">
                Price
              </span>
              <p className="pp-order-hint" id="order-price-hint">
                USDC · pay once
              </p>
              <div
                className="pp-price-value"
                aria-labelledby="order-price-label"
                aria-describedby="order-price-hint"
              >
                {REPORT_PRICE}
              </div>
            </div>
          </div>

          <button type="submit" className="pp-cta" disabled={busy}>
            <span>{ctaLabel}</span>
            <span className="pp-cta-price">{REPORT_PRICE}</span>
          </button>

          <div className="pp-meta-row">
            <span className={wallet.className}>
              <i aria-hidden />
              {wallet.label}
            </span>
            {showConnect ? (
              <button
                type="button"
                className="pp-linkish"
                onClick={() => void connectDesktopWallet()}
                disabled={busy}
              >
                Connect wallet
              </button>
            ) : null}
          </div>

          {phase === "payment" ? (
            <PaymentBanner
              error={error}
              miniPay={miniPay}
              browseUrl={miniPayBrowseUrl}
            />
          ) : null}

          {error && phase === "error" ? (
            <div className="pp-banner pp-banner-err" role="alert">
              {error}
            </div>
          ) : null}
        </form>
      </section>

      {report ? <ReportView report={report} /> : null}
    </div>
  );
}

function PaymentBanner({
  error,
  miniPay,
  browseUrl,
}: {
  error: string | null;
  miniPay: boolean;
  browseUrl: string | null;
}) {
  if (error) {
    return (
      <div className="pp-banner pp-banner-pay" role="status">
        {error}
      </div>
    );
  }

  if (miniPay) {
    return (
      <div className="pp-banner pp-banner-pay" role="status">
        Approve {REPORT_PRICE} USDC in MiniPay.
      </div>
    );
  }

  return (
    <div className="pp-banner pp-banner-pay" role="status">
      Open in MiniPay to pay {REPORT_PRICE} USDC.
      {browseUrl ? (
        <>
          {" "}
          <a className="pp-inline-link" href={browseUrl}>
            Open
          </a>
        </>
      ) : null}
    </div>
  );
}
