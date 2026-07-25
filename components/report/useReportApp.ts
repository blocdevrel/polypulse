"use client";

import { useEffect, useState } from "react";
import type { ReportResponse } from "@/types";
import { connectHostWallet, isMiniPay } from "@/lib/minipay";
import { fetchReport } from "@/lib/fetch/report";
import { validateOrderInput } from "./order";

export type ReportPhase = "idle" | "loading" | "payment" | "done" | "error";

export function useReportApp() {
  const [url, setUrl] = useState("");
  const [limit, setLimit] = useState(20);
  const [phase, setPhase] = useState<ReportPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [miniPay, setMiniPay] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setMiniPay(isMiniPay());
    if (typeof window === "undefined" || !window.ethereum) return;

    let cancelled = false;
    void connectHostWallet()
      .then((addr) => {
        if (!cancelled) setAddress(addr);
      })
      .catch(() => {
        if (!cancelled) setAddress(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitOrder() {
    const validated = validateOrderInput({ url, limit });
    if (!validated.ok) {
      setError(validated.error);
      setPhase("error");
      return;
    }

    setError(null);
    setReport(null);
    setPhase("loading");

    const result = await fetchReport(validated.url, validated.limit);

    if (result.ok) {
      setReport(result.report);
      setPhase("done");
      return;
    }

    if (result.paymentRequired) {
      setPhase("payment");
      setError(result.error || null);
      return;
    }

    setError(result.error);
    setPhase("error");
  }

  async function connectDesktopWallet() {
    try {
      const addr = await connectHostWallet();
      setAddress(addr);
      if (!addr) {
        setError("No wallet found. Open this app inside MiniPay.");
        setPhase("error");
      }
    } catch {
      setError("Could not connect wallet. Prefer MiniPay on your phone.");
      setPhase("error");
    }
  }

  return {
    url,
    setUrl,
    limit,
    setLimit,
    phase,
    error,
    report,
    miniPay,
    address,
    busy: phase === "loading",
    showConnect: !miniPay && !address,
    submitOrder,
    connectDesktopWallet,
  };
}
