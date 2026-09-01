# TrustPoint

Trust-centric payment protection and escrow infrastructure for freelancers and their clients.

TrustPoint lets a freelancer create a project agreement, generate a protected payment link backed by a dedicated virtual account, hold funds in escrow, and release them automatically on client approval — with an auditable, tamper-evident ledger behind every movement of money.

> **Live site:** [trustpoint-eight.vercel.app](https://trustpoint-eight.vercel.app)

---

## Why this exists

Freelance payments are asymmetric: the client wants confidence before paying, the freelancer wants certainty they'll be paid. The trust that physical commerce relies on doesn't exist by default online. TrustPoint engineers it into the platform with three primitives:

1. **Escrow** — funds are held safely until delivery is approved.
2. **Verification** — payment events, client identity, and dispute resolutions are verified and recorded.
3. **Auditability** — every financial event lands on an append-only, signed ledger.

## Highlights

- **End-to-end escrow lifecycle** — fund → hold → milestone approval → release, driven by an explicit job/escrow state machine.
- **Tamper-evident ledger** — every financial event is recorded to an append-only `LedgerEntry` signed with an HMAC over the event payload, making silent tampering detectable.
- **Secure Paystack integration** — HMAC signature verification on webhooks, atomic deduplication via a unique `eventId` constraint so events are processed exactly once, even under redelivery.
- **Automated escrow release** with serverless worker processing and retry.
- **Admin console** — dashboard, fee management, and a full dispute resolution workflow (open → review → resolve).
- **Client approval via one-time codes** — milestone/client approval uses short-lived verification codes rather than shared credentials.
- **Dual auth** — Firebase (app users) plus server-side token/session auth layered across API routes with origin checks.

## Architecture

```
Client (Freelancer / Client / Admin)
        │
        ▼
   Next.js App (App Router, RSC, Server Actions + API routes)
        │
        ├───────────────┬────────────────────────┐
        ▼               ▼                        ▼
   Paystack API      Firebase Auth         Prisma ORM
   (Payments,        (Identity)            │
    Virtual Accounts,                       ▼
    Transfers)                     PostgreSQL (Aiven)
                                        ├─ EscrowState
                                        ├─ LedgerEntry  (append-only, signed)
                                        ├─ WebhookEvent (idempotency)
                                        └─ 20+ models (Jobs, Milestones,
                                           Disputes, Notifications, Evidence…)
```

The core flow:

1. Freelancer creates a **project agreement** (job + optional milestones).
2. The platform mints a **protected payment reference** and a dedicated **virtual account**.
3. Client funds the project; Paystack fires a `charge.success` webhook.
4. The webhook verifies the HMAC signature, then **funds escrow** and writes to the ledger.
5. Freelancer completes work and submits **evidence**.
6. Client approves (via one-time code); funds are **released** to the freelancer.
7. Disputes, if raised, flow to the admin console for resolution.

## Tech stack

| Layer        | Choice                                             |
| ------------ | -------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19, TypeScript      |
| Styling      | Tailwind CSS 4, shadcn/ui-style primitives, Framer Motion, Sonner |
| ORM          | Prisma 7 + PostgreSQL (Aiven), `@prisma/adapter-pg` connection pool |
| Payments     | Paystack (charges, virtual accounts, transfers)    |
| Auth         | Firebase Auth + Firebase Admin, server-side token/session middleware |
| Email        | Resend                                            |
| Background   | Serverless functions / cron for auto-release & retries |
| Quality      | Zod validation, strict TS, security-focused middleware |

## Getting started

```bash
# 1. Install (generates Prisma client via postinstall)
npm install

# 2. Copy environment template and fill in values
cp .env.local.example .env.local
#   - DATABASE_URL (Aiven/PostgreSQL)
#   - PAYSTACK_SECRET_KEY
#   - FIREBASE_* config + service account
#   - RESEND_API_KEY
#   - LEDGER_HMAC_SECRET
#   - NEXTAUTH/JWT secrets

# 3. Push the schema to your database
npm run db:push

# 4. Run locally
npm run dev
```

## Project layout

```
src/
  app/
    api/                  # Route handlers (escrow, jobs, milestones, payouts,
                          #  payments, webhooks/paystack, admin, banks)
    (main)/               # Public + authenticated UI (auth, provider, dashboard)
    admin/                # Admin console (dashboard, disputes, fees)
    client/job/[token]/   # Client-facing secured approval flow
  components/             # UI + feature components
  lib/
    security/             # webhooks (HMAC), tokens, admin, html sanitization
    services/             # escrow, ledger, auto-release
    paystack/             # payments client
    state-machines/       # job/escrow transition logic
    notifications/        # channels & delivery
```

## Security notes

- **Webhook authenticity** — Paystack `x-paystack-signature` is verified against `PAYSTACK_SECRET_KEY` before any state change.
- **Exactly-once processing** — duplicate webhook deliveries are rejected via a unique constraint on `WebhookEvent.eventId` (P2002 is treated as success).
- **Tamper-evident ledger** — each `LedgerEntry` carries an HMAC signature over `{jobId, event, actorId, amount, balance, reference, metadata}`, enabling integrity verification on read.
- **Scope checks** — escrow/job reads and mutations verify the caller's identity against `clientId`/`providerId` on every route.
- **Code-gated approvals** — client approvals and milestone progress use short-lived one-time codes.

## Roadmap (in development)

- Ledger integrity verification endpoint (re-hash + compare on read)
- Dispute-driven escrow hold/unhold with arbitrator manual release
- Payout retry with exponential backoff and idempotency keys
- Evidence integrity (hash pinning + immutable storage)

---

Built by **Michael Johnson** — [michaeljohnson.dev](https://michaeljohnson.dev)

*This project is an engineering portfolio demonstrating trust infrastructure, escrow engineering, secure payment flows, and event-driven architecture.*