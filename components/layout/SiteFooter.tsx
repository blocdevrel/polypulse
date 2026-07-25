import Link from "next/link";
import { REPORT_PRICE } from "@/components/report/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="pp-site-footer">
      <div className="pp-site-footer-inner">
        <div className="pp-footer-top">
          <div className="pp-footer-brand">
            <Link href="/" className="pp-footer-mark" aria-label="PolyPulse home">
              <span className="pp-orb pp-orb-sm" aria-hidden />
              <strong>PolyPulse</strong>
            </Link>
            <p>BTC Up/Down reports · {REPORT_PRICE} USDC · Celo x402</p>
          </div>

          <nav className="pp-footer-nav" aria-label="Footer">
            <Link href="/">Report</Link>
            <Link href="/order">Orders</Link>
            <a href="https://x402.celo.org" target="_blank" rel="noreferrer">
              x402
            </a>
            <a
              href="https://docs.celo.org/build-on-celo/build-on-minipay/quickstart"
              target="_blank"
              rel="noreferrer"
            >
              MiniPay
            </a>
          </nav>
        </div>

        <div className="pp-footer-bar">
          <span>© {year} PolyPulse</span>
          <span className="pp-footer-settle">Settled on Celo</span>
        </div>
      </div>
    </footer>
  );
}
