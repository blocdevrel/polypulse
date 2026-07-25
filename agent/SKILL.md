---
name: polypulse
description: >-
  PolyPulse project context — Celo Track 2 x402 Polymarket intelligence agent
  (Next.js API, MiniPay, Neon, thirdweb). Use when working in the PolyPulse
  repo, building report/API/payments/UI, deploying to Railway, or when the user
  mentions PolyPulse, x402, MiniPay, or Polymarket reports.
---

# PolyPulse Agent

Read this instead of re-scanning README/architecture unless details are missing.

## Product

- Pay-per-report Polymarket intelligence on **Celo**
- Primary track: **Track 2 — Most x402 Payments** (count settlements to `PAY_TO_WALLET`)
- UX: mobile-first MiniPay web UI (brand sheet: Plus Jakarta Sans, mint `#BEEEA8`, ink `#1F1F1F`) — desktop splits brand aside + flow
- Telegram: token set (`TELEGRAM_BOT_TOKEN`); link under `bot/` **after web UI** — front door → MiniPay deeplink only (no in-chat signing)
- No prepaid ledger / no deposit balances

## Stack

- Next.js App Router at **repo root** (UI + API one process)
- Neon Postgres + Prisma (`ReportReceipt` exactly-once)
- thirdweb x402 `network: celo` (`CLIENT_SECRET` → secretKey)
- Polymarket Gamma + CLOB (public, no API key)
- Anthropic for short `analysis` (fallback if missing/fails)
- Host: Railway service `polypulse` → `https://polypulse-production-5c29.up.railway.app`

## Layout

```
app/api/report     POST — thin HTTP
app/api/health     GET
lib/report         validate + pipeline + buildReport
lib/polymarket     resolve slug/URL → condition_id; trades
lib/payments       x402 settle / 402
lib/db             Prisma receipts
lib/analysis       Anthropic summary
lib/config.ts      env accessors
types/             DTOs
prisma/schema.prisma
```

## Request contract

`POST /api/report` body: `{ url: string, limit?: number }`

Headers (paid): `PAYMENT-SIGNATURE` or `X-PAYMENT`

Flow: validate/resolve → **400** if bad (never charge) → settle → **402** if unpaid → receipt by `paymentKey` → build once → **200** JSON

Response fields: `input`, `slug`, `condition_id`, `limit`, `count`, `trades`, `positions`, `analysis`, `timestamp`

## Env

`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `SERVER_WALLET`, `PAY_TO_WALLET`, `REPORT_PRICE`, `ANTHROPIC_API_KEY`

Never commit `.env`. `.env.example` is the template.

## Rules

- Thin routes; business logic in `lib/`
- Charge only after market resolve succeeds
- Exactly-once via `ReportReceipt.paymentKey` (not a credit wallet)
- USDC on Celo via x402 — not native CELO for the fee
- Keep backend-first until API is solid; then MiniPay UI
- Prefer editing existing modules over new folders
- Do not re-dump README into chats — use this skill + open specific files

## Commands

```bash
npm run dev
npm run build          # prisma generate && next build
npm run db:push        # prisma db push
railway up --service polypulse
```

## Deferred

- Wire thirdweb `wrapFetchWithPayment` for seamless MiniPay x402 retry
- Telegram bot deeplink into `/pay?requestId=`
- Track 1 volume farming, prepaid credits
