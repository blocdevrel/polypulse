"use client";

import { useState } from "react";
import type { ReportResponse } from "@/types";
import { OrdersList } from "./OrdersList";
import { ReportView } from "./ReportView";

export function OrdersApp() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const stageClass = report ? "pp-stage has-report" : "pp-stage";

  return (
    <div className={stageClass}>
      <section className="pp-order-page">
        <OrdersList
          refreshToken={0}
          selectedId={selectedOrderId}
          onSelectId={setSelectedOrderId}
          onSelectReport={setReport}
        />
      </section>

      {report ? <ReportView report={report} /> : null}
    </div>
  );
}
