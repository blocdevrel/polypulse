function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function resolveAppUrl(): string {
  const fromEnv =
    optional("NEXT_PUBLIC_APP_URL") ||
    optional("APP_URL") ||
    optional("RAILWAY_PUBLIC_DOMAIN") ||
    optional("VERCEL_URL");

  if (fromEnv) {
    const withProto = /^https?:\/\//i.test(fromEnv)
      ? fromEnv
      : `https://${fromEnv}`;
    return withProto.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export const config = {
  get appUrl() {
    return resolveAppUrl();
  },
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get clientId() {
    return optional("CLIENT_ID") || optional("NEXT_PUBLIC_CLIENT_ID");
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
