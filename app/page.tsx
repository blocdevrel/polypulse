import type { Metadata } from "next";
import { ReportApp } from "@/components/report/ReportApp";

export const metadata: Metadata = {
  title: "PolyPulse · New report",
  description:
    "Order a BTC Up/Down Polymarket intelligence report — pay USDC via x402 on Celo.",
};

export default function HomePage() {
  return <ReportApp />;
}
