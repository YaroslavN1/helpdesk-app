# Helpdesk — Project Memory

## Overview
AI-powered ticket management system. Customers submit issues via email; the system creates tickets automatically, classifies them, and uses Claude AI to generate responses. High-confidence responses are sent automatically; low-confidence tickets are escalated to a human agent.

See `project-planning/` for full scope, tech stack decisions, and implementation plan.

## Tech Stack
- **Runtime / package manager:** Bun
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (style: base-nova, neutral base color)
- **Backend:** Express 5, TypeScript (run directly with Bun)
- **Validation:** Zod 4 — schemas that are used on both client and server live in `core/src/schemas/`; server-only or client-only schemas can be defined locally
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
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── AdminRoute.tsx         # redirects non-admins to /; shows <LoadingScreen /> while pending
│   │   │   ├── ConfirmationDialog.tsx # generic alert-dialog for destructive confirmations
│   │   │   ├── Layout.tsx             # Navbar + <main> wrapper (Outlet)
│   │   │   ├── LoadingScreen.tsx      # full-screen "Loading…" used by route guards and LoginPage
│   │   │   ├── Navbar.tsx             # top nav; admin-only Users link
│   │   │   ├── ProtectedRoute.tsx     # redirects unauthenticated to /login; shows <LoadingScreen /> while pending
│   │   │   ├── UserForm.tsx           # create/edit dialog + form; exports User and FormState types
│   │   │   └── UsersTable.tsx         # users table with loading/error/data states; edit + delete actions
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── UsersPage.tsx         # /users — admin only; fetches users
│   │   ├── lib/
│   │   │   ├── auth-client.ts  # Better Auth client with inferAdditionalFields
│   │   │   └── utils.ts        # cn() helper (clsx + tailwind-merge)
│   │   ├── App.tsx             # route tree (see Routing section)
│   │   └── main.tsx
│   ├── components.json     # shadcn/ui config
│   ├── vite.config.ts      # proxies /api → localhost:3000; @ alias → ./src
│   └── tsconfig.json       # @ path alias configured
├── core/                 # Shared TypeScript — schemas, types used by both client and server
│   ├── package.json        # name: @helpdesk/core; exports: ./src/index.ts
│   └── src/
│       ├── constants/      # Shared constants (e.g. role.ts — UserRole enum)
│       ├── schemas/        # Zod schemas (one file per domain entity, e.g. user.ts)
│       └── index.ts        # re-exports everything from schemas/ and constants/
├── server/               # Express backend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── auth.ts       # Better Auth config (Prisma adapter, additionalFields)
│   │   │   ├── middleware.ts # requireAuth / requireAdmin Express middleware
│   │   │   ├── prisma.ts
│   │   │   └── validate.ts   # validate(schema, body, res) — Zod validation helper for routes
│   │   ├── routes/
│   │   │   ├── users.ts
│   │   │   └── webhooks.ts
│   │   ├── index.ts
│   │   ├── seed-admin.ts   # creates admin user (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME)
│   │   └── seed-agent.ts   # creates agent user (SEED_AGENT_EMAIL / SEED_AGENT_PASSWORD / SEED_AGENT_NAME)
│   └── tsconfig.json
├── e2e/                  # Playwright end-to-end tests
│   ├── helpers.ts        # shared constants (ADMIN_*, AGENT_*) and loginAsAdmin / loginAsAgent helpers
│   ├── global-setup.ts   # creates helpdesk_test DB (or truncates if exists), runs migrations, seeds admin + agent
│   ├── auth.spec.ts      # authentication, session, route protection, navbar role visibility
│   └── users.spec.ts     # UsersPage rendering, API protection, create / edit / delete flows
├── project-planning/     # Scope, tech stack, implementation plan
├── .env.test             # E2E env vars (single source of truth)
├── playwright.config.ts  # Playwright config; loads .env.test via dotenv
└── package.json          # Bun workspaces root
```

## Dev Commands
```bash
bun dev               # start both client and server in parallel
bun client            # start client only  (http://localhost:5173)
bun server            # start server only  (http://localhost:3000)
bun test:unit         # run Vitest unit tests (one-shot)
bun test:unit:watch   # run Vitest unit tests in watch mode
bun test:e2e          # run Playwright E2E tests (headless)
bun test:e2e:ui       # run Playwright E2E tests with interactive UI
bun test:e2e:debug    # run Playwright E2E tests in debug mode
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
- **ProtectedRoute** — checks `authClient.useSession()`; shows `<LoadingScreen />` while pending
- **AdminRoute** — checks `session.user.role === 'admin'`; also shows `<LoadingScreen />` while pending (session resolves in ProtectedRoute first, but AdminRoute re-reads it for the role check)
- **Layout** — owns the page shell (Navbar + main wrapper); page components only render their own content

## Shared Code (`core/`)
Import via `@helpdesk/core` in either the client or server package.

- **Schemas** — Zod schemas shared between client and server go in `core/src/schemas/` (one file per domain entity, e.g. `user.ts`), re-exported from `core/src/index.ts`.
- **Constants** — Shared constants go in `core/src/constants/` (one file per domain, e.g. `role.ts`), re-exported from `core/src/index.ts`.
- **`UserRole` enum** — Always import from `@helpdesk/core`, never hardcode `'admin'` or `'agent'` strings. Used in client components, server routes, and `auth.ts`.

## Server Utilities (`server/src/lib/`)

- **`validate.ts`** — Use `validate(schema, req.body, res)` whenever a route needs to validate a request body with Zod. It calls `safeParse`, sends a `400` with the first error message if invalid, and returns `null` so the route can `return` early. Returns the typed parsed data on success.

  ```ts
  import { validate } from '../lib/validate'

  const data = validate(mySchema, req.body, res)
  if (!data) return
  // data is fully typed here
  ```

  Never write the `safeParse` / `issues[0].message` block inline — always use this helper.

- **`middleware.ts`** — `requireAuth` and `requireAdmin` Express middleware. Session is stored in `res.locals.session` after `requireAuth`.

## UI Components
- Add shadcn components with `bunx shadcn@latest add <component>` (run from `client/`)
- Import using the `@/` alias: `import { Button } from '@/components/ui/button'`
- Use `cn()` from `@/lib/utils` for conditional/merged class names
- Tailwind tokens (`text-muted-foreground`, `text-destructive`, `bg-background`, etc.) are defined as CSS vars in `src/index.css` — prefer these over hard-coded colors

## Testing Strategy
**Default to component (unit) tests. Use E2E tests only for flows that require a real browser, real auth session, or multi-step UI interactions that are impractical to unit-test** (e.g. full login flow, role-based redirects, cross-page workflows).

For most new features — a new page, a new component, API fetch behaviour — write unit tests first. Only reach for E2E when the feature genuinely needs it.

## Unit Testing
All unit test writing must be delegated to the **`unit-test-writer`** agent — never write Vitest/React Testing Library tests inline.

The agent owns all unit testing knowledge: Vitest config, jsdom environment, `fetch` mocking with `vi.stubGlobal`, `act()` warning patterns, selector strategy, and the setup file at `client/src/test/setup.ts`. Run tests with `bun test:unit`.

Key conventions owned by the agent:
- Test files live next to the component: `UsersPage.tsx` → `UsersPage.test.tsx`
- Use a never-resolving fetch mock for synchronous-state tests (avoids `act()` warnings)
- Put all assertions that depend on the same async state inside one `waitFor` callback

## E2E Testing
Use sparingly — only when unit tests cannot cover the scenario. All e2e test writing must be delegated to the **`e2e-test-writer`** agent — never write Playwright tests inline.

The agent owns all Playwright knowledge: test structure, selector strategy, auth helpers, global setup, env vars, ports, and the `helpdesk_test` database setup. Run tests with `bun test:e2e`.

Key conventions the agent must follow:
- Shared helpers live in `e2e/helpers.ts` — import `loginAsAdmin(page)` / `loginAsAgent(page)` instead of calling credentials manually; add new shared helpers there
- Always read URLs, ports, secrets, and other environment-specific values from `process.env` — check `.env.test` for the available variables before hardcoding anything
- Do not add section-divider comments (e.g. `// --- Route protection ---`) above `test.describe()` blocks — the describe label already serves that purpose
- `createUser(page)` is a local helper in `users.spec.ts` that generates its own unique name/email and returns `{ name, email }`; tests should destructure only what they use
- When asserting table cells by name or email, always pass `{ exact: true }` to `getByRole` to avoid partial/case-insensitive matches hitting multiple cells

## Docs
Always use **context7** to fetch up-to-date documentation before working with any library or framework — including Express, React, Prisma, Vite, Bun, shadcn/ui, and the Anthropic SDK. Do not rely on training data alone for API signatures or configuration options.
