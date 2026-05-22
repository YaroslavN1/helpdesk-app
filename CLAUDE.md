# Helpdesk — Project Memory

## Overview
AI-powered ticket management system. Customers submit issues via email; the system creates tickets automatically, classifies them, and uses Claude AI to generate responses. High-confidence responses are sent automatically; low-confidence tickets are escalated to a human agent.

See `project-planning/` for full scope, tech stack decisions, and implementation plan.

## Tech Stack
- **Runtime / package manager:** Bun
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (style: base-nova, neutral base color)
- **Backend:** Express 5, TypeScript (run directly with Bun)
- **Database:** PostgreSQL, Prisma ORM, pgvector extension
- **Auth:** Better Auth — email/password only, sign-up disabled, database sessions via HTTP-only cookie
- **Email:** SendGrid or Mailgun (TBD) — inbound webhook + transactional sending
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`)
- **Deployment:** Docker + cloud provider (TBD)

## Project Structure
```
/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── AdminRoute.tsx  # redirects non-admins to /
│   │   │   ├── Layout.tsx      # Navbar + <main> wrapper (Outlet)
│   │   │   ├── Navbar.tsx      # top nav; admin-only Users link
│   │   │   └── ProtectedRoute.tsx  # redirects unauthenticated to /login
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── UsersPage.tsx   # /users — admin only
│   │   ├── lib/
│   │   │   ├── auth-client.ts  # Better Auth client with inferAdditionalFields
│   │   │   └── utils.ts        # cn() helper (clsx + tailwind-merge)
│   │   ├── App.tsx             # route tree (see Routing section)
│   │   └── main.tsx
│   ├── components.json     # shadcn/ui config
│   ├── vite.config.ts      # proxies /api → localhost:3000; @ alias → ./src
│   └── tsconfig.json       # @ path alias configured
├── server/               # Express backend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── auth.ts     # Better Auth config (Prisma adapter, additionalFields)
│   │   │   └── prisma.ts
│   │   ├── index.ts
│   │   ├── seed-admin.ts   # creates admin user (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
│   │   └── seed-agent.ts   # creates agent user (SEED_AGENT_EMAIL / SEED_AGENT_PASSWORD / SEED_AGENT_NAME)
│   └── tsconfig.json
├── e2e/                  # Playwright end-to-end tests
│   ├── global-setup.ts   # creates helpdesk_test DB, runs migrations, truncates tables, seeds admin + agent
│   └── (tests go here)
├── project-planning/     # Scope, tech stack, implementation plan
├── .env.test             # E2E env vars (single source of truth)
├── playwright.config.ts  # Playwright config; loads .env.test via dotenv
└── package.json          # Bun workspaces root
```

## Dev Commands
```bash
bun dev             # start both client and server in parallel
bun client          # start client only  (http://localhost:5173)
bun server          # start server only  (http://localhost:3000)
bun test:e2e        # run Playwright E2E tests (headless)
bun test:e2e:ui     # run Playwright E2E tests with interactive UI
bun test:e2e:debug  # run Playwright E2E tests in debug mode
```

## Authentication
- **Library:** Better Auth — email/password only, sign-up disabled, HTTP-only cookie sessions
- **Roles:** `UserRole` enum — `admin` | `agent`. Exposed via `additionalFields` in `server/src/lib/auth.ts`; typed on the client via `inferAdditionalFields<typeof auth>()` in `auth-client.ts`
- **Client usage:** `authClient.signIn.email({ email, password })` to sign in; `authClient.useSession()` hook for session/role
- **Seeding:** `server/src/seed-admin.ts` and `server/src/seed-agent.ts` — see those files for env var names
- **Full auth implementation details** (env vars, security posture, route guard patterns) live in `.claude/agents/security-reviewer.md`
- **All authentication changes must be delegated to the `security-reviewer` agent** — it holds the complete auth context and security requirements

## Routing
Route tree in `client/src/App.tsx`:
```
/login                     → LoginPage (public)
ProtectedRoute             → redirects to /login if no session
  └── Layout               → renders Navbar + <main><Outlet /></main>
        ├── /              → HomePage (any authenticated user)
        └── AdminRoute     → redirects to / if role !== 'admin'
              └── /users   → UsersPage
* → redirect to /
```
- **ProtectedRoute** — checks `authClient.useSession()`; shows a loading spinner while pending
- **AdminRoute** — checks `session.user.role === 'admin'`; no loading state needed (always runs after ProtectedRoute resolves)
- **Layout** — owns the page shell (Navbar + main wrapper); page components only render their own content

## UI Components
- Add shadcn components with `bunx shadcn@latest add <component>` (run from `client/`)
- Import using the `@/` alias: `import { Button } from '@/components/ui/button'`
- Use `cn()` from `@/lib/utils` for conditional/merged class names
- Tailwind tokens (`text-muted-foreground`, `text-destructive`, `bg-background`, etc.) are defined as CSS vars in `src/index.css` — prefer these over hard-coded colors

## E2E Testing
All e2e test writing must be delegated to the **`e2e-test-writer`** agent — never write Playwright tests inline.

Invoke it after implementing any new page, feature, or significant UI change:
```
use the e2e-test-writer agent to write tests for <feature>
```

The agent owns all Playwright knowledge: test structure, selector strategy, auth helpers, global setup, env vars, ports, and the `helpdesk_test` database setup. Run tests with `bun test:e2e`.

## Docs
Always use **context7** to fetch up-to-date documentation before working with any library or framework — including Express, React, Prisma, Vite, Bun, shadcn/ui, and the Anthropic SDK. Do not rely on training data alone for API signatures or configuration options.
