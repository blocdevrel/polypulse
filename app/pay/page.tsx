"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PayInner() {
  const params = useSearchParams();
  const requestId = params.get("requestId");

  const href = useMemo(() => {
    if (!requestId) return "/";
    return `/?requestId=${encodeURIComponent(requestId)}`;
  }, [requestId]);

  return (
    <div className="pp-stage">
      <header className="pp-hero">
        <div className="pp-logo">
          <span className="pp-orb" aria-hidden />
          <h1 className="pp-wordmark">PolyPulse</h1>
        </div>
        <p className="pp-tagline">Finish payment in MiniPay, then open your report.</p>
      </header>

      <div className="pp-order">
        <div className="pp-order-head">
          <span className="pp-order-kicker">Payment</span>
          <h2 className="pp-order-title">Finish in MiniPay</h2>
        </div>
        <p className="pp-order-hint">
          {requestId
            ? "This handoff link is for Telegram → MiniPay. Continue to complete the report."
            : "Missing request id. Start from home or your Telegram link."}
        </p>
        {requestId ? (
          <p className="pp-order-hint" style={{ marginTop: "-0.35rem" }}>
            Request · {requestId}
          </p>
        ) : null}

        <Link
          href={href}
          className="pp-cta"
          style={{ textDecoration: "none" }}
        >
          <span>Continue</span>
          <span className="pp-cta-price">Go</span>
        </Link>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="pp-shell">
          <div className="pp-stage">Loading…</div>
        </main>
      }
    >
      <main className="pp-shell">
        <PayInner />
      </main>
    </Suspense>
  );
}
