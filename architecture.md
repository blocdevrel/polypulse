# PolyPulse — Architecture & Folder Structure

Single Next.js app. MiniPay is Celo’s wallet — we only ship a web app that runs inside it (dev mode / browse URL). Product plan: [README.md](./README.md).

```
PolyPulse/
├── app/
│   ├── (web)/              # UI: paste URL → pay → report
│   ├── api/
│   │   ├── report/         # POST /api/report (x402 + deliver)
│   │   └── health/
│   └── pay/                # /pay?requestId= (Telegram handoff later)
├── components/
│   ├── report/
│   └── payment/
├── lib/
│   ├── minipay/            # isMiniPay, auto-connect
│   ├── polymarket/         # Gamma + CLOB + slug resolve
│   ├── payments/           # x402 / thirdweb (Celo)
│   ├── analysis/           # short LLM summary
│   └── report/             # validate → build JSON (charge only after valid)
├── types/                  # request / report shapes
├── bot/                    # optional later: OpenClaw / Telegram → MiniPay link
└── scripts/
```

## Flow

```
MiniPay loads our web app → UI → POST /api/report
  → lib/report (validate)
  → lib/payments (402 or settle; user signs in MiniPay)
  → lib/polymarket + lib/analysis
  → JSON report
```

Dev: run the Next app, open it in MiniPay developer mode (or a desktop Celo wallet for testing).
