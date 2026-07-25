"use client";

import { useEffect, useState } from "react";
import type { ReportResponse, SettledOrderSummary } from "@/types";

type OrdersListProps = {
  refreshToken: number;
  onSelectReport: (report: ReportResponse) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
};

export function OrdersList({
  refreshToken,
  onSelectReport,
  selectedId,
  onSelectId,
}: OrdersListProps) {
  const [orders, setOrders] = useState<SettledOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/orders?limit=50");
        const data = (await res.json()) as {
          orders?: SettledOrderSummary[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "Failed to load orders");
        }
        if (!cancelled) {
          setOrders(data.orders ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load orders");
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  async function openOrder(id: string) {
    if (openingId) return;
    setOpeningId(id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = (await res.json()) as {
        report?: ReportResponse;
        error?: string;
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error || "Failed to open order");
      }
      onSelectId(id);
      onSelectReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open order");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <section className="pp-orders" aria-labelledby="orders-heading">
      <div className="pp-orders-head">
        <h1 id="orders-heading" className="pp-orders-title">
          Settled orders
        </h1>
        <p className="pp-orders-subtitle">
          {loading
            ? "Loading…"
            : orders.length === 0
              ? "No completed payments yet"
              : `${orders.length} completed · tap to reopen`}
        </p>
      </div>

      {error ? (
        <p className="pp-orders-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && orders.length > 0 ? (
        <ul className="pp-orders-list">
          {orders.map((order) => {
            const active = selectedId === order.id;
            const busy = openingId === order.id;
            return (
              <li key={order.id}>
                <button
                  type="button"
                  className={
                    active ? "pp-orders-item is-active" : "pp-orders-item"
                  }
                  onClick={() => void openOrder(order.id)}
                  disabled={Boolean(openingId)}
                  aria-pressed={active}
                >
                  <span className="pp-orders-item-main">
                    <strong>{order.slug}</strong>
                    <span>
                      {formatWhen(order.createdAt)}
                      {order.tradeCount != null
                        ? ` · ${order.tradeCount} trades`
                        : ""}
                    </span>
                  </span>
                  <span className="pp-orders-badge">
                    {busy ? "Opening…" : "Settled"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
