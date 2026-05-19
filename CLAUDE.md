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
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── lib/utils.ts    # cn() helper (clsx + tailwind-merge)
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── components.json     # shadcn/ui config
│   ├── vite.config.ts      # proxies /api → localhost:3000; @ alias → ./src
│   └── tsconfig.json       # @ path alias configured
├── server/               # Express backend
│   ├── src/
│   │   └── index.ts
│   └── tsconfig.json
├── project-planning/     # Scope, tech stack, implementation plan
└── package.json          # Bun workspaces root
```

## Dev Commands
```bash
bun dev        # start both client and server in parallel
bun client     # start client only  (http://localhost:5173)
bun server     # start server only  (http://localhost:3000)
```

## Authentication
- **Library:** Better Auth (`better-auth`)
- **Strategy:** Email/password only; sign-up is disabled — users must be seeded directly into the database
- **Sessions:** HTTP-only cookie, managed automatically by Better Auth
- **Server:** `server/src/lib/auth.ts` — configured with the Prisma adapter; all auth routes handled at `/api/auth/*` via `toNodeHandler(auth)` in `server/src/index.ts`
- **Client:** `client/src/lib/auth-client.ts` — exports `authClient` (created with `createAuthClient()`)
  - Sign in: `authClient.signIn.email({ email, password })`
  - Session: `authClient.useSession()` React hook — returns `{ data, isPending }`
- **Required env vars (server):**
  - `BETTER_AUTH_SECRET` — random secret for signing sessions
  - `BETTER_AUTH_URL` — server origin (e.g. `http://localhost:3000`)
  - `TRUSTED_ORIGIN` — frontend origin allowed to make auth requests (e.g. `http://localhost:5173`)

## UI Components
- Add shadcn components with `bunx shadcn@latest add <component>` (run from `client/`)
- Import using the `@/` alias: `import { Button } from '@/components/ui/button'`
- Use `cn()` from `@/lib/utils` for conditional/merged class names
- Tailwind tokens (`text-muted-foreground`, `text-destructive`, `bg-background`, etc.) are defined as CSS vars in `src/index.css` — prefer these over hard-coded colors

## Docs
Always use **context7** to fetch up-to-date documentation before working with any library or framework — including Express, React, Prisma, Vite, Bun, shadcn/ui, and the Anthropic SDK. Do not rely on training data alone for API signatures or configuration options.
