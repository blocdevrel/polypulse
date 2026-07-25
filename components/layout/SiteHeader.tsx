import Link from "next/link";
import { REPORT_PRICE } from "@/components/report/constants";

export function SiteHeader() {
  return (
    <header className="pp-site-header">
      <div className="pp-site-header-inner">
        <Link href="/" className="pp-brand" aria-label="PolyPulse home">
          <span className="pp-orb pp-orb-sm" aria-hidden />
          <span className="pp-brand-text">PolyPulse</span>
        </Link>

        <nav className="pp-site-nav" aria-label="Primary">
          <Link href="/" className="pp-nav-link">
            Report
          </Link>
          <Link href="/order" className="pp-nav-link">
            Orders
          </Link>
        </nav>

        <div className="pp-header-meta">
          <span className="pp-header-live" aria-label="Agent is live">
            <i aria-hidden />
            Live
          </span>
          <span className="pp-header-rail">Celo · x402</span>
          <span className="pp-header-price">{REPORT_PRICE}</span>
        </div>
      </div>
    </header>
  );
}
