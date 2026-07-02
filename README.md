# Helpdesk

An AI-powered ticket management system. Customers submit issues via email; the system creates tickets automatically, classifies them, and uses Claude AI to draft and send responses. High-confidence responses are sent automatically — low-confidence tickets are escalated to a human agent.

> **Work in progress.** Current progress is tracked in [`project-planning/implementation-plan.md`](project-planning/implementation-plan.md).

Tech stack, project structure, and conventions are documented in [`CLAUDE.md`](CLAUDE.md).

---

## Prerequisites

- [Bun](https://bun.sh) v1.x
- PostgreSQL

---

## Getting Started

**1. Install dependencies**

```bash
bun install
```

**2. Configure environment**

```bash
cp server/.env.example server/.env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, WEBHOOK_SECRET
```

**3. Run database migrations**

```bash
cd server && bunx prisma migrate deploy
```

**4. Seed the admin account**

```bash
cd server && bun prisma/seed-admin.ts
```

**5. Start the development servers**

```bash
bun dev   # starts both client (localhost:5173) and server (localhost:3000)
```

---

## Available Scripts

```bash
bun dev               # start client + server in parallel
bun client            # start client only
bun server            # start server only
bun test:unit         # run Vitest unit tests
bun test:unit:watch   # run Vitest unit tests in watch mode
bun test:e2e          # run Playwright E2E tests (headless)
bun test:e2e:ui       # run Playwright E2E tests with UI
bun test:e2e:debug    # run Playwright E2E tests in debug mode
```

---

## Roles

| Role | Capabilities |
|---|---|
| `admin` | Full access — manage agents, view all tickets |
| `agent` | View and manage tickets, no user management |

Sign-up is disabled. The admin account is created via the seed script; agents are created by the admin through the UI.
