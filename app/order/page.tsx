import type { Metadata } from "next";
import { OrdersApp } from "@/components/report/OrdersApp";

export const metadata: Metadata = {
  title: "Orders · PolyPulse",
  description: "Settled x402 report payments on Celo.",
};

export default function OrderPage() {
  return <OrdersApp />;
}
