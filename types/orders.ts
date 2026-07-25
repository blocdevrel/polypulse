export type SettledOrderSummary = {
  id: string;
  slug: string;
  input: string;
  status: "completed";
  createdAt: string;
  tradeCount: number | null;
};
