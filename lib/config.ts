function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** Lazy getters so build/import does not fail when unused env is empty. */
export const config = {
  get appUrl() {
    return (
      optional("NEXT_PUBLIC_APP_URL")?.replace(/\/$/, "") ||
      "http://localhost:3000"
    );
  },
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get clientId() {
    return optional("CLIENT_ID");
  },
  get clientSecret() {
    return required("CLIENT_SECRET");
  },
  get serverWallet() {
    return required("SERVER_WALLET");
  },
  get payToWallet() {
    return required("PAY_TO_WALLET");
  },
  get reportPrice() {
    const raw = (optional("REPORT_PRICE") || "0.05").replace(/^\$/, "").trim();
    return `$${raw || "0.05"}`;
  },
  get anthropicApiKey() {
    return optional("ANTHROPIC_API_KEY");
  },
};
