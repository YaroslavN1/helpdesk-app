# Helpdesk — Project Memory

## Overview

AI-powered ticket management system. Customers submit issues via email; the system creates tickets automatically, classifies them, and uses Claude AI to generate responses. High-confidence responses are sent automatically; low-confidence tickets are escalated to a human agent.

See `project-planning/` for full scope, tech stack decisions, and implementation plan.

## Tech Stack

- **Runtime / package manager:** Bun
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (style: base-nova, neutral base color)
- **Backend:** Express 5, TypeScript (run directly with Bun)
- **Validation:** Zod 4 — schemas that are used on both client and server live in `core/src/schemas/`; server-only or client-only schemas can be defined locally
- **Client data fetching:** TanStack Query + Axios — see Client Data Fetching section
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
│   │   │   ├── ui/                    # shadcn/ui components + custom reusables
│   │   │   │   ├── confirmation-dialog.tsx # generic alert-dialog for destructive confirmations
│   │   │   │   ├── input-debounced.tsx    # debounced search input with leading icon; exposes an `InputDebouncedHandle` ref (`cancel(nextValue)`) so a parent can reset the displayed value and drop a pending debounce without waiting for it to fire
│   │   │   │   ├── multi-select.tsx       # generic multi-select dropdown (base-ui Menu)
│   │   │   │   ├── pagination.tsx         # page nav with prev/next and ellipsis range
│   │   │   │   ├── select-field.tsx       # labeled Select + optional error message (Label + Select); props-driven, owns no mutation
│   │   │   │   ├── select.tsx             # single-value select (base-ui Select)
│   │   │   │   ├── sortable-head.tsx      # table <th> with asc/desc/unsorted icon
│   │   │   │   └── textarea.tsx           # native <textarea>, styled to match Input; no base-ui primitive for this one
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx             # Navbar + <main> wrapper (Outlet)
│   │   │   │   ├── LoadingScreen.tsx      # full-screen "Loading…" used by route guards and LoginPage
│   │   │   │   └── Navbar.tsx             # top nav; admin-only Users link
│   │   │   ├── routing/
│   │   │   │   ├── AdminRoute.tsx         # redirects non-admins to /; shows <LoadingScreen /> while pending
│   │   │   │   └── ProtectedRoute.tsx     # redirects unauthenticated to /login; shows <LoadingScreen /> while pending
│   │   │   ├── tickets/                      # TicketsPage's own components (list/filter/sort) — see ticket/ below for TicketPage's
│   │   │   │   ├── TicketsFilters.tsx        # search input + status/category multi-selects; "Clear filters" also calls the search input's `cancel()` ref handle, so a pending debounced search doesn't overwrite the just-cleared filters
│   │   │   │   ├── TicketsTable.tsx          # sortable table; clicking a row navigates to /tickets/:id
│   │   │   │   └── ticket-badges.ts          # TICKET_STATUS_BADGE map (variant + className); labels live in @helpdesk/core
│   │   │   ├── ticket/                       # TicketPage's own components (detail view) — see tickets/ above for TicketsPage's
│   │   │   │   ├── TicketBody.tsx            # three render states: auto-resizing sandboxed <iframe srcDoc> when the DOMPurify-sanitized htmlBody still has content, a plain-text fallback when there is no htmlBody, and that same fallback preceded by a "couldn't be safely displayed" notice when htmlBody sanitized down to nothing; shared by TicketDetails (the ticket's own body) and TicketReply (each reply's body) — takes body/htmlBody/iframeTitle/className directly, not a Ticket or Reply. Sanitizing is wrapped in `useMemo` keyed on `htmlBody`, since each `TicketReply` instance re-renders on every keystroke in `TicketReplyThread`'s reply draft (sibling state, re-renders the whole list) — without it, every reply's HTML would be re-sanitized on every keystroke instead of once per distinct `htmlBody`
│   │   │   │   ├── TicketDetail.tsx          # single labeled metadata row (dt/dd); used by TicketDetails for From/Received/Updated
│   │   │   │   ├── TicketDetails.tsx         # read-only ticket presentation for TicketPage — TicketDetail metadata rows + TicketBody, the latter wrapped in a bordered card
│   │   │   │   ├── TicketEditableDetails.tsx # status/category/agent SelectFields for TicketPage; owns one useUpdateTicket mutation per field
│   │   │   │   ├── TicketPageSkeleton.tsx    # skeleton loader shown while the ticket page is fetching
│   │   │   │   ├── TicketReply.tsx           # single reply's rendering (sender/date header + TicketBody); used by TicketReplyThread
│   │   │   │   ├── TicketReplyForm.tsx       # compose box; props-driven, owns no mutation
│   │   │   │   └── TicketReplyThread.tsx     # reply thread + form for TicketPage; owns useReplies/useCreateReply
│   │   │   └── users/
│   │   │       ├── UserForm.tsx           # create/edit dialog + form; exports FormState type (User type lives in @/types/user)
│   │   │       └── UsersTable.tsx         # users table with loading/error/data states; edit + delete actions
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── TicketsPage.tsx        # /tickets — filter/sort/paginate tickets via useTickets; state lives in URL search params via useTicketsUrlParams
│   │   │   ├── TicketPage.tsx         # /tickets/:id — fetches a single ticket via useTicket; details render via TicketDetails, field edits go through TicketEditableDetails/useUpdateTicket, replies render via TicketReplyThread below the message
│   │   │   └── UsersPage.tsx          # /users — admin only; fetches/creates/edits/deletes users via useUsers hooks
│   │   ├── hooks/
│   │   │   ├── useAgents.ts           # useAgents — TanStack Query hook fetching /users/agents, for assignment dropdowns
│   │   │   ├── useReplies.ts          # useReplies(ticketId) + useCreateReply(ticketId); create appends to its own cache and invalidates useTicket's ticketQueryKey (reply creation bumps the ticket's updatedAt server-side)
│   │   │   ├── useTicket.ts           # useTicket(id) + useUpdateTicket(id); share a ticketQueryKey(id) builder so the mutation's direct cache write always targets the same key the query reads; ticketQueryKey is exported for useReplies.ts to reuse
│   │   │   ├── useTickets.ts          # useTickets({ sort, filters, page }) — list query; builds its request query string via buildRequestQuery from useTicketsUrlParams
│   │   │   ├── useTicketsUrlParams.ts # reads/writes TicketsPage's sort/filters/page as URL search params (useSearchParams); exports buildUrlQuery (omits values matching the defaults, for a clean shareable URL) and buildRequestQuery (always includes sortBy/sortOrder/page/pageSize, for the actual API call) — two different serializations of the same TicketsParams, built for different consumers
│   │   │   └── useUsers.ts            # useUsers/useCreateUser/useUpdateUser/useDeleteUser — TanStack Query hooks; mutations write results directly into the query cache instead of invalidating
│   │   ├── lib/
│   │   │   ├── api-client.ts   # shared Axios instance (baseURL /api, withCredentials) + getErrorMessage(error, fallback)
│   │   │   ├── auth-client.ts  # Better Auth client with inferAdditionalFields
│   │   │   ├── cn.ts           # cn() helper (clsx + tailwind-merge) for conditional class names
│   │   │   ├── format-date.ts  # formatDate(date, format) date formatter
│   │   │   └── query-client.ts # shared QueryClient instance, provided in main.tsx
│   │   ├── types/
│   │   │   └── user.ts         # User type (id, name, email, role, createdAt)
│   │   ├── App.tsx             # route tree (see Routing section)
│   │   └── main.tsx            # wraps <App /> in QueryClientProvider
│   ├── components.json     # shadcn/ui config
│   ├── vite.config.ts      # proxies /api → localhost:3000; @ alias → ./src
│   └── tsconfig.json       # @ path alias configured
├── core/                 # Shared TypeScript — schemas, types used by both client and server
│   ├── package.json        # name: @helpdesk/core; exports: ./src/index.ts
│   └── src/
│       ├── constants/      # Shared constants (e.g. role.ts — UserRole enum)
│       ├── schemas/        # Zod schemas (one file per domain entity, e.g. user.ts)
│       ├── types/          # Shared plain (non-schema) types (e.g. ticket.ts — TicketsSortCriteria, TicketsFilterCriteria)
│       └── index.ts        # re-exports everything from schemas/, constants/, and types/
├── server/               # Express backend
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   ├── seed-admin.ts   # creates admin user (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
│   │   └── seed-agent.ts   # creates agent user (SEED_AGENT_EMAIL / SEED_AGENT_PASSWORD / SEED_AGENT_NAME)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── auth.ts       # Better Auth config (Prisma adapter, additionalFields)
│   │   │   ├── middleware.ts # requireAuth / requireAdmin Express middleware
│   │   │   ├── prisma.ts
│   │   │   ├── reply.ts      # createReply({ ticketId, body, htmlBody, senderType, userId }) — creates a Reply + bumps the ticket's updatedAt in one transaction; shared by reply-routes.ts (agent replies) and webhooks.ts (customer replies via inbound email)
│   │   │   ├── sanitize-html.ts # sanitizeHtml(dirty) — DOMPurify (over a jsdom window) with WHOLE_DOCUMENT; strips <script>/<iframe>/on* handlers from inbound email HTML before it is stored
│   │   │   └── validate.ts   # validate(schema, body, res) — Zod validation helper for routes
│   │   ├── routes/
│   │   │   ├── tickets/
│   │   │   │   ├── index.ts           # assembles the router; router.param('id', ticketIdParam) is registered once here, shared by every :id route below
│   │   │   │   ├── reply-routes.ts    # GET/POST /:id/replies — registerReplyRoutes(router) called from index.ts; POST delegates to lib/reply.ts's createReply
│   │   │   │   ├── ticket-id-param.ts # ticketIdParam — parses/loads the ticket once per :id request, 404s if missing, attaches the result to res.locals.ticket
│   │   │   │   └── ticket-routes.ts   # GET /, GET /:id, PATCH /:id — registerTicketRoutes(router) called from index.ts
│   │   │   ├── users.ts
│   │   │   └── webhooks.ts    # POST /inbound-email — creates a Ticket, or attaches as a Reply (via createReply) to a matching open ticket from the same sender+subject if one exists
│   │   └── index.ts
│   └── tsconfig.json
├── e2e/                  # Playwright end-to-end tests
│   ├── helpers.ts        # shared constants (ADMIN_*, AGENT_*) and loginAsAdmin / loginAsAgent helpers
│   ├── global-setup.ts   # creates helpdesk_test DB (or truncates if exists), runs migrations, seeds admin + agent
│   └── tests/
│       ├── auth.spec.ts             # authentication, session, route protection, navbar role visibility
│       ├── ticket.spec.ts           # TicketPage rendering, selectors (status/category/agent), error states
│       ├── tickets.spec.ts          # TicketsPage rendering, filter/sort/pagination flows
│       ├── users.spec.ts            # UsersPage rendering, API protection, create / edit / delete flows
│       └── webhooks.spec.ts         # POST /api/webhooks/inbound-email — payload validation, secret check, subject normalisation
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
bun typecheck         # type-check client, server, and core (tsc --noEmit in each)
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
- **Seeding:** `server/prisma/seed-admin.ts` and `server/prisma/seed-agent.ts` — see those files for env var names
- **Full auth implementation details** (env vars, security posture, route guard patterns) live in `.claude/agents/security-reviewer.md`
- **All authentication changes must be delegated to the `security-reviewer` agent** — it holds the complete auth context and security requirements

## Routing

Route tree in `client/src/App.tsx`:

```
/login                     → LoginPage (public)
ProtectedRoute             → redirects to /login if no session
  └── Layout               → renders Navbar + <main><Outlet /></main>
        ├── /              → HomePage (any authenticated user)
        ├── /tickets       → TicketsPage (any authenticated user)
        ├── /tickets/:id   → TicketPage (any authenticated user)
        └── AdminRoute     → redirects to / if role !== 'admin'
              └── /users   → UsersPage
* → redirect to /
```

- **ProtectedRoute** — checks `authClient.useSession()`; shows `<LoadingScreen />` while pending
- **AdminRoute** — checks `session.user.role === 'admin'`; also shows `<LoadingScreen />` while pending (session resolves in ProtectedRoute first, but AdminRoute re-reads it for the role check)
- **Layout** — owns the page shell (Navbar + main wrapper); page components only render their own content

## Shared Code (`core/`)

Import via `@helpdesk/core` in either the client or server package.

- **Schemas** — Zod schemas shared between client and server go in `core/src/schemas/` (one file per domain entity, e.g. `user.ts`, `ticket.ts`), re-exported from `core/src/index.ts`. This includes both request schemas (e.g. `createUserSchema`, `updateTicketSchema`) and response schemas (e.g. `userSchema`, `agentSchema`, `ticketSchema`, `ticketDetailsSchema`, `paginatedTicketsSchema`) — every type that models a domain entity or API payload is defined as a Zod schema first, with its TypeScript type derived via `z.infer<typeof theSchema>`, rather than hand-written as a plain type. A schema can extend another (e.g. `ticketDetailsSchema = ticketSchema.extend({ ... })`) and reference another domain's schema (e.g. `ticketDetailsSchema`'s `assignedTo` field reuses `agentSchema` from `user.ts`) instead of duplicating shape.
- **Constants** — Shared constants/enums go in `core/src/constants/` (one file per domain, e.g. `role.ts`), re-exported from `core/src/index.ts`. Keep this to actual constants/enums — plain data-shape types belong in `types/`.
- **Types** — `core/src/types/` is only for plain types that aren't validated at a boundary (e.g. `ticket.ts` — `TicketsSortCriteria`, `TicketsFilterCriteria`, which describe client-side URL/query state, not a request or response payload), re-exported from `core/src/index.ts`. Anything representing a request or response payload belongs in `schemas/` as a Zod schema instead (see above).
- **`UserRole` enum** — Always import from `@helpdesk/core`, never hardcode `'admin'` or `'agent'` strings. Used in client components, server routes, and `auth.ts`.
- **`TICKET_STATUS_LABELS` / `TICKET_CATEGORY_LABELS`** — Human-readable label maps (`Record<TicketStatus | TicketCategory, string>`). Import from `@helpdesk/core` whenever you need to display a ticket status or category as text. Category labels are short: `'General'`, `'Technical'`, `'Refund'`.
- **`SENDER_TYPE_LABELS`** — Same convention, for `SenderType` (`Record<SenderType, string>` — `'Agent'` / `'Customer'`). Import whenever displaying who sent a reply.

## Server Utilities (`server/src/lib/`)

- **`validate.ts`** — Use `validate(schema, input, res)` whenever a route needs to validate input with Zod. Works for both `req.body` and `req.query`. It calls `safeParse`, sends a `400` with the first error message if invalid, and returns `null` so the route can `return` early. Returns the typed parsed data on success.

  ```ts
  import { validate } from '../lib/validate'

  const data = validate(mySchema, req.body, res)
  if (!data) return
  // data is fully typed here

  const query = validate(querySchema, req.query, res)
  if (!query) return
  ```

  Never write the `safeParse` / `issues[0].message` block inline — always use this helper.

- **`middleware.ts`** — `requireAuth` and `requireAdmin` Express middleware. Session is stored in `res.locals.session` after `requireAuth`.

- **`sanitize-html.ts`** — `sanitizeHtml(dirty)` returns a DOMPurify-cleaned copy of an HTML string. DOMPurify needs a DOM, and there isn't one on the server, so the module builds a single jsdom window at import time and reuses it for every call. Sanitizing with `WHOLE_DOCUMENT: true` keeps the `<html>`/`<head>`/`<body>` structure intact, which matters because inbound email HTML is usually a full document whose `<head>` carries the `<style>` the message depends on. See HTML Sanitization below for where to call it.

## HTML Sanitization

Customer-supplied HTML reaches the app through `POST /api/webhooks/inbound-email` and is rendered back to agents in `TicketBody`. It is sanitized twice, and both passes are load-bearing:

- **On ingest (server)** — `webhooks.ts` runs `htmlBody` through `sanitizeHtml()` before it reaches either write path, so nothing dangerous is stored in the first place. Sanitize at this boundary, where untrusted input arrives, rather than inside `createReply` or another shared write helper.
- **On render (client)** — `TicketBody` runs the stored `htmlBody` through DOMPurify again before putting it in the iframe's `srcDoc`. This is not redundant. There is no backfill migration, so every row written before server-side sanitization existed is still unsanitized in the database, and this pass is what makes those rows safe to display.

`createReplySchema` accepts only `body`, so an agent reply can never carry HTML; the webhook is the only route that accepts `htmlBody` at all. If a future route starts accepting HTML, sanitize it at that route, the same way `webhooks.ts` does.

**The iframe's `sandbox="allow-same-origin"` must never gain `allow-scripts`.** `allow-same-origin` is there only so `setIframeHeight` can read `contentWindow.document` to auto-size the iframe — with no `allow-scripts`, there's nothing inside the frame able to act on that same-origin access. Add `allow-scripts` alongside it and that changes: any script that ends up in the frame (a DOMPurify gap, a future config change) would then execute with the app's real origin — reachable cookies, session, and DOM — not a sandboxed one. This is a well-known sandbox-escape pairing, not a hypothetical.

## Response Validation

Every route response body is validated on the way out, not just request input: call the matching response schema's `.parse()` (or `z.array(schema).parse()` for a list) on the data right before `res.json(...)`, e.g. `res.json(ticketDetailsSchema.parse(updatedTicket))` or `res.status(201).json(userSchema.parse(user))`. This catches drift between a Prisma query's actual shape and the documented API response shape (e.g. a missing `include`/`select` field) at the point the bug is introduced, instead of surfacing as a silent shape mismatch on the client. Response schemas live in `core/src/schemas/` alongside request schemas (see Shared Code section above) — reuse the same schema a route's JSDoc-equivalent response type is documented as returning; don't hand-roll a one-off inline schema in the route file.

## Express 5 Error Handling

Express 5 automatically forwards errors thrown (or rejected promises) in async route handlers to the error-handling middleware — no `try/catch` needed in routes. Only catch explicitly when you need to distinguish error types or return a specific status (e.g. 404 vs 500). Never wrap an entire route body in `try/catch` just to return a 500.

## Tickets API

### `GET /api/tickets`

Filter, sort, and paginate tickets. Auth required.

**Query params**

| Param       | Type               | Default             | Notes                                                          |
| ----------- | ------------------ | ------------------- | -------------------------------------------------------------- |
| `sortBy`    | `TicketSortColumn` | `createdAt`         | `id`, `subject`, `fromName`, `status`, `category`, `createdAt` |
| `sortOrder` | `asc` \| `desc`    | `desc`              |                                                                |
| `search`    | `string`           | —                   | matches id, subject, fromName, fromEmail                       |
| `status`    | `TicketStatus[]`   | `[]`                | repeatable param                                               |
| `category`  | `TicketCategory[]` | `[]`                | repeatable param                                               |
| `page`      | `number`           | `1`                 |                                                                |
| `pageSize`  | `number`           | `DEFAULT_PAGE_SIZE` | max 100                                                        |

**Response** `200` — `PaginatedTickets` (`{ tickets: Ticket[], total: number }`)

> URL state in `TicketsPage` — all params are kept in URL search params via `useTicketsUrlParams` (`useSearchParams` underneath); defaults are omitted from the URL itself, but always sent explicitly to this endpoint via `useTickets`'s `buildRequestQuery`; any filter/sort change resets page to 1.

### `GET /api/tickets/:id`

Fetch a single ticket by numeric ID. Auth required.

**Path params**

| Param | Type     | Notes                   |
| ----- | -------- | ----------------------- |
| `id`  | `number` | must be a valid integer |

**Response**

- `200` — `TicketDetails` (`Ticket` + `body: string`, `htmlBody: string | null`, `assignedTo: Agent | null`, `updatedAt: string`)
- `400` — invalid (non-integer) ID
- `404` — ticket not found

### `PATCH /api/tickets/:id`

Update a ticket's status, category, and/or assigned agent. All fields are optional; only provided fields are updated. Auth required.

**Path params**

| Param | Type     | Notes                   |
| ----- | -------- | ----------------------- |
| `id`  | `number` | must be a valid integer |

**Body** (`updateTicketSchema`)

| Field          | Type                     | Notes                                                     |
| -------------- | ------------------------ | --------------------------------------------------------- |
| `assignedToId` | `string \| null`         | optional; must be a non-deleted agent; `null` to unassign |
| `status`       | `TicketStatus`           | optional                                                  |
| `category`     | `TicketCategory \| null` | optional; `null` to clear                                 |

**Response**

- `200` — full `TicketDetails` (same shape as `GET /api/tickets/:id`)
- `400` — invalid ticket ID, invalid body, or `assignedToId` is not a valid agent
- `404` — ticket not found

### `GET /api/tickets/:id/replies`

List all replies for a ticket, ordered oldest first. Auth required.

**Path params**

| Param | Type     | Notes                   |
| ----- | -------- | ----------------------- |
| `id`  | `number` | must be a valid integer |

**Response**

- `200` — `Reply[]`, ordered by `createdAt` ascending
- `400` — invalid (non-integer) ID
- `404` — ticket not found

### `POST /api/tickets/:id/replies`

Add a reply to a ticket. Always created as `senderType: 'agent'`, authored by the authenticated session user — this endpoint has no way to create a `'customer'`-sender reply; that only happens via `POST /api/webhooks/inbound-email` (see Webhooks API below). Creating a reply also bumps the parent ticket's `updatedAt` — both writes happen in the same Prisma `$transaction`, via the shared `createReply` helper (`server/src/lib/reply.ts`, also used by the inbound-email webhook), so the reply and the ticket's "last activity" timestamp change atomically (`data: {}` alone does **not** trigger `@updatedAt` in this Prisma setup — the field must be set explicitly, e.g. `updatedAt: new Date()`). Auth required.

**Path params**

| Param | Type     | Notes                   |
| ----- | -------- | ----------------------- |
| `id`  | `number` | must be a valid integer |

**Body** (`createReplySchema`)

| Field  | Type     | Notes               |
| ------ | -------- | ------------------- |
| `body` | `string` | required, non-empty |

**Response**

- `201` — created `Reply`
- `400` — invalid ticket ID or invalid body
- `404` — ticket not found

## Webhooks API

### `POST /api/webhooks/inbound-email`

Ingests an inbound email. Requires the `x-webhook-secret` header to match `WEBHOOK_SECRET` (`requireWebhookSecret` middleware).

**Body** (`inboundEmailSchema`)

| Field      | Type     | Notes                     |
| ---------- | -------- | -------------------------- |
| `from`     | `string` | valid email                |
| `fromName` | `string` | required                   |
| `subject`  | `string` | required                   |
| `body`     | `string` | plain text, required       |
| `htmlBody` | `string` | optional                   |

**Behavior:** `htmlBody`, when present, is run through `sanitizeHtml()` (`server/src/lib/sanitize-html.ts`) before either write path below, so the stored HTML is already clean — see HTML Sanitization above. `subject` is run through `normalizeSubject()` first, which strips leading `Re:`/`Fwd:` prefixes (repeated, case-insensitive). The server then looks for an existing ticket from the same `fromEmail`, with the same normalized `subject` (case-insensitive), and `status: 'open'`:

- **Match found** — the email is attached as a `Reply` (`senderType: 'customer'`, `userId: null`) via the shared `createReply` helper (`server/src/lib/reply.ts`), which also bumps the matched ticket's `updatedAt` in the same transaction. No new ticket is created.
- **No match** — a new `Ticket` is created (`status: 'open'`), same as if this feature didn't exist. This also covers the case where a matching ticket exists but isn't `open` (e.g. already resolved) — a new ticket is started rather than reopening or appending to the old one.

**Response**

- `201` — either the created `Reply` or the created `Ticket` (validated against `ticketSchema`, so the `assignedTo: { name }` field is included even though a freshly-created ticket is always unassigned), depending on which branch fired. Neither response includes an explicit "kind" discriminator field — check for `senderType`'s presence to tell them apart if consuming this response programmatically.
- `400` — invalid payload
- `401` — missing or incorrect `x-webhook-secret`

## Users API

### `GET /api/users/agents`

List all non-deleted agents for assignment dropdowns. Auth required (any role).

**Response** `200` — `Agent[]` (`{ id: string, name: string }[]`), ordered by name

### `GET /api/users`

List all non-deleted users. Admin only.

**Response** `200` — `{ id, name, email, role, createdAt }[]`, ordered by createdAt asc

### `POST /api/users`

Create an agent account. Admin only.

**Body** (`createUserSchema`) — `name`, `email`, `password`

**Response**

- `201` — created user `{ id, name, email, role, createdAt }`
- `409` — email already exists

### `PATCH /api/users/:id`

Edit a user's name, email, or password. Admin only.

**Body** (`updateUserSchema`) — `name`, `email`, optional `password`

**Response**

- `200` — updated user `{ id, name, email, role, createdAt }`
- `404` — user not found
- `409` — email already exists

### `DELETE /api/users/:id`

Soft-delete a user (sets `deletedAt`). Admin only. Admins cannot be deleted. Any tickets currently assigned to the deleted user are unassigned (`assignedToId` set to `null`). The soft-delete, ticket unassignment, and session cleanup all run in a single `prisma.$transaction` so the deleted user can never be left still assigned to a ticket.

**Response**

- `204` — success
- `403` — target is an admin
- `404` — user not found

> All types and schemas (`Agent`, `TicketDetails`, `updateTicketSchema`, `createUserSchema`, `updateUserSchema`, `Reply`, `createReplySchema`, etc.) are exported from `@helpdesk/core`.

## UI Components

- Add shadcn components with `bunx shadcn@latest add <component>` (run from `client/`)
- Import using the `@/` alias: `import { Button } from '@/components/ui/button'`
- Use `cn()` from `@/lib/cn` for conditional/merged class names
- Tailwind tokens (`text-muted-foreground`, `text-destructive`, `bg-background`, etc.) are defined as CSS vars in `src/index.css` — prefer these over hard-coded colors

## Client Utilities (`client/src/lib/`)

- **`cn(...inputs)`** (`lib/cn.ts`) — clsx + tailwind-merge helper for conditional class names
- **`formatDate(date, format?)`** (`lib/format-date.ts`) — locale-aware date formatter. `format` is `'date'` (default, date only) or `'datetime'` (date + `HH:MM:SS`). Uses `en-US` locale with `toLocaleString`. Use `'datetime'` for ticket metadata (Received, Updated); `'date'` for table columns.
  ```ts
  formatDate(ticket.createdAt) // "Mar 15, 2024"
  formatDate(ticket.updatedAt, 'datetime') // "Mar 15, 2024, 10:00:00 AM"
  ```

## Client Data Fetching

- **TanStack Query + Axios** — all client API calls go through the shared `apiClient` (`client/src/lib/api-client.ts`, an Axios instance with `baseURL: '/api'` and `withCredentials: true`) inside `useQuery`/`useMutation` hooks. Never call `fetch()` directly from a component.
- **One hooks file per domain entity** — e.g. `client/src/hooks/useUsers.ts` exports `useUsers` (query) plus `useCreateUser`/`useUpdateUser`/`useDeleteUser` (mutations).
- **Direct cache writes over invalidation** — mutation `onSuccess` handlers write the result straight into the query cache with `queryClient.setQueryData(queryKey, updater)` (append for create, map for update, filter for delete) instead of calling `invalidateQueries()`. This avoids an extra refetch after every create/update/delete. See `useCreateUser`/`useUpdateUser`/`useDeleteUser` in `useUsers.ts` for the pattern. A `DELETE` mutation's `onSuccess` must derive the removed id from the mutation's variables (its second argument), not from `data` — `DELETE` responses have no body.
- **`getErrorMessage(error, fallback)`** (`client/src/lib/api-client.ts`) — extracts a server-provided error string from an Axios error's response body, falling back to `fallback` otherwise. Returns `null` for falsy `error` input, so call sites can pass query/mutation `error` state directly (`getErrorMessage(error, '...')`) without a ternary.
- **`queryClient`** (`client/src/lib/query-client.ts`) — single app-wide `QueryClient` instance, provided via `QueryClientProvider` in `main.tsx`. Query retries are capped at 1 (`defaultOptions.queries.retry: 1`) — TanStack Query's default (3 retries, exponential backoff) delays a failed query's `error` state by ~7s, which reads as a stuck loading skeleton before any error ever appears. This only affects `useQuery` reads (e.g. `useUsers`) — mutations (`useCreateUser`/`useUpdateUser`/`useDeleteUser`) have their own separate retry setting under `defaultOptions.mutations`, which is left at TanStack Query's default of `0`.
- **Shared query-key builders** — when a query and a mutation both target the same cache entry (e.g. `useTicket`/`useUpdateTicket`), define the key once as a function (e.g. `ticketQueryKey(id)`) and reuse it in both places, rather than writing the key array literal twice. Otherwise the two can silently drift apart — the mutation's cache write stops matching what the query reads, with no error anywhere to point at why.
- **Cross-resource cache invalidation** — a mutation can affect a *different* resource's cache than the one it directly owns. `useCreateReply` (`useReplies.ts`) appends to its own `repliesQueryKey` cache directly (as above), but also calls `queryClient.invalidateQueries({ queryKey: ticketQueryKey(String(ticketId)) })`, since creating a reply also bumps the parent ticket's `updatedAt` server-side — without this, `useTicket`'s cached copy would stay stale until some unrelated refetch. `ticketQueryKey` is exported from `useTicket.ts` specifically so `useReplies.ts` can target the exact same cache entry instead of duplicating the key shape. The `String(ticketId)` conversion at that call site is intentional, not a bug — `useTicket`'s key is built from the route-param string, while `useReplies`/`useCreateReply`'s `ticketId` is a real number (matching `Reply.ticketId`'s actual type), so this is the one place those two representations have to be bridged.
- **Two serializations of the same params, for two different consumers** (`useTicketsUrlParams.ts`) — `buildUrlQuery` omits any field that matches its default, keeping the browser's address bar clean/shareable; `buildRequestQuery` always includes `sortBy`/`sortOrder`/`page`/`pageSize` regardless of defaults, since the API call needs an explicit, unambiguous request every time. Both delegate filter serialization (`search`/`status`/`category`) to the same shared `appendFiltersQuery` helper — filters are applied identically in both cases, only the sort/page fields differ in omission behavior between the two.

## Testing Strategy

**Default to component (unit) tests. Use E2E tests only for flows that require a real browser, real auth session, or multi-step UI interactions that are impractical to unit-test** (e.g. full login flow, role-based redirects, cross-page workflows).

For most new features — a new page, a new component, API fetch behaviour — write unit tests first. Only reach for E2E when the feature genuinely needs it.

## Unit Testing

All unit test writing must be delegated to an agent — never write Vitest tests inline. Which agent depends on which side of the stack is under test:

- **Client (React components/pages)** → `client-unit-test-writer`
- **Server (Express middleware/routes/helpers)** → `server-unit-test-writer`

Run all unit tests (client + server) with `bun test:unit`.

### Client unit tests

The `client-unit-test-writer` agent owns all client unit testing knowledge: Vitest config, jsdom environment, mocking `apiClient` at the module boundary, `act()` warning patterns, selector strategy, and the setup file at `client/src/test-utils/setup.ts`.

Key conventions owned by the agent:

- Test files live next to the component: `UsersPage.tsx` → `UsersPage.test.tsx`
- **Mocking `apiClient`** — call the bare `vi.mock('@/lib/api-client')` (no factory argument) at the top of the test file. Vitest auto-substitutes `client/src/lib/__mocks__/api-client.ts`, which replaces `get`/`post`/`patch`/`delete` with `vi.fn()` while re-exporting the real `getErrorMessage`. Do not pass an inline factory to `vi.mock()` here — a factory is hoisted above all imports in the file, so a factory that references an imported helper throws `ReferenceError: Cannot access '...' before initialization` at runtime.
- **`mockResolved(fn, value)` / `mockRejected(fn, error)` / `mockReturn(fn, value)` / `mockPending(fn)`** (`client/src/test-utils/mock-helpers.ts`) — use these instead of inline `vi.mocked(apiClient.get).mockResolvedValue(...)`-style calls. E.g. `mockResolved(apiClient.get, { data: USERS })`, `mockRejected(apiClient.post, { isAxiosError: true, response: { data: { error: '...' } } })`, `mockPending(apiClient.get)` for a never-resolving mock in synchronous-state tests (avoids `act()` warnings).
- **`renderWithQueryClient(ui)` / `renderHookWithQueryClient(renderCallback)`** (`client/src/test-utils/render-with-query-client.tsx`) — wrap RTL's `render`/`renderHook` with a fresh `QueryClient` (query retries disabled) inside a `QueryClientProvider`. Use these instead of RTL's `render`/`renderHook` directly for any component or hook that calls a TanStack Query hook. `renderHookWithQueryClient` also returns the `queryClient` instance so a test can seed (`queryClient.setQueryData(...)`) or inspect (`queryClient.getQueryData(...)`) cache state directly.
- Put all assertions that depend on the same async state inside one `waitFor` callback
- Do not add section-divider comments (e.g. `// --- Fixtures ---`, `// ---------- Helpers ----------`) — the code structure already communicates that
- Shared fixtures live in `client/src/test-utils/fixtures.ts` — named ticket exports (`openTechnicalTicket`, `resolvedRefundTicket`, `closedTicket`, `openGeneralTicket`) plus a `TICKETS` array, and named user exports (`USERS`, `NEW_USER`). Use named exports in tests that need a specific combination to avoid `getByText` ambiguity; `closedTicket` has `category: null` and `assignedTo: { name: 'Dave Agent' }` (non-null) for this reason.
- Date assertions use a regex (`/Mar 15, 2024/`) rather than an exact string to stay timezone-safe across environments
- **Testing a `useSearchParams`-backed hook** (e.g. `useTicketsUrlParams`) — wrap the render helper's callback to call `useLocation()` alongside the hook under test and return both (`() => ({ hook: useHook(), location: useLocation() })`), wrapped in a `MemoryRouter`. Assert state-mutating behavior (e.g. omitting a default value from the URL) against `location.search` directly, not just the hook's own parsed-back return value — reading a parsed value back can't distinguish "the URL genuinely omitted this param" from "the URL has it, and it happens to equal the default," since both parse back identically.
- **Seed test state through the hook's own real write path, not a shortcut** — e.g. prefer rendering with an empty URL and calling the hook's own setter to populate it, over passing a raw pre-built URL string straight into `MemoryRouter`'s `initialEntries`. The latter bypasses the hook entirely and tests parsing a URL shape that may never actually occur in the running app.
- **Testing cross-hook cache invalidation** (e.g. `useReplies.test.tsx`'s "refetches an active ticket query" test) — same multi-hook-render technique as the `useSearchParams` case above, applied to two TanStack Query hooks instead of a hook + router state: render both together in one callback (`() => ({ ticket: useTicket('1'), createReply: useCreateReply(1) })`) so the target query has a real active observer, then assert a *second* `apiClient` call happens after the mutation resolves. Asserting `invalidateQueries` was called is not sufficient — it's an implementation detail, and TanStack Query's default `refetchType: 'active'` means invalidating a query with no mounted observer is a no-op, so the only way to prove the invalidation → refetch chain actually fires is to mount the observer and watch for the resulting request.

### Server unit tests

The `server-unit-test-writer` agent owns all server unit testing knowledge: Vitest config (`node` environment, not jsdom), mocking local modules (`./auth`, `./prisma`) with `vi.mock`, how to drive the code under test (supertest for routes, hand-built Express fakes for middleware — see below), and env var handling via `server/.env.test`.

Key conventions owned by the agent:

- Test files live next to the source file: `middleware.ts` → `middleware.test.ts`
- **Routes → supertest.** Mount the router on a throwaway Express app (`app.use(express.json())`, `app.use('/', router)`) and drive it with `request(app).post('/…').send(payload)`, asserting on `response.status` / `response.body`. Don't reach into `router.stack` to pull a handler out and call it directly — that depends on Express internals and skips the route's own middleware chain. See `webhooks.test.ts`.
- **Middleware and plain helpers → hand-built fakes.** A bare `Request`/`Response`/`NextFunction` object with only the fields under test is enough, and it keeps the assertions about that one function. See `middleware.test.ts`.
- When a route's middleware isn't what's under test, mock it to a pass-through (`vi.fn((_request, _response, next) => next())`) so requests still reach the handler — e.g. `webhooks.test.ts` does this for `requireWebhookSecret`, whose own behavior is covered in `middleware.test.ts`
- Never hit a real database or a real Better Auth session — mock at the module boundary with `vi.mock`
- Restore any `process.env` mutation in `afterEach` so tests don't leak state into each other
- Env vars a module needs at import time (e.g. `DATABASE_URL`, `BETTER_AUTH_SECRET`) go in `server/.env.test` (gitignored, dummy values only) — never hardcode them in `vitest.config.ts` or a test file

## E2E Testing

Use sparingly — only when unit tests cannot cover the scenario. All e2e test writing must be delegated to the **`e2e-test-writer`** agent — never write Playwright tests inline.

The agent owns all Playwright knowledge: test structure, selector strategy, auth helpers, global setup, env vars, ports, and the `helpdesk_test` database setup. Run tests with `bun test:e2e`.

**Ports:** E2E tests run against a dedicated test server — client on `http://localhost:5174`, API server on `http://localhost:3001`. These differ from the dev ports (5173 / 3000). Always read the exact URLs from `process.env` (set in `.env.test`) rather than hardcoding.

Key conventions the agent must follow:

- Shared helpers live in `e2e/helpers.ts` — import `loginAsAdmin(page)` / `loginAsAgent(page)` instead of calling credentials manually; add new shared helpers there
- Always read URLs, ports, secrets, and other environment-specific values from `process.env` — check `.env.test` for the available variables before hardcoding anything
- Do not add section-divider comments (e.g. `// --- Route protection ---`) above `test.describe()` blocks — the describe label already serves that purpose
- `createUser(page)` is a local helper in `users.spec.ts` that generates its own unique name/email and returns `{ name, email }`; tests should destructure only what they use
- When asserting table cells by name or email, always pass `{ exact: true }` to `getByRole` to avoid partial/case-insensitive matches hitting multiple cells
- **Base UI Select trigger includes a `▼` chevron in its DOM text** — always use `toContainText` (not `toHaveText`) when asserting the current value of a Select trigger
- `ticket.spec.ts` is structured to mirror the unit test file: single top-level `test.describe('TicketPage')` with nested `route protection`, `error states`, and `data rendering` (which contains `page header`, `ticket metadata → static metadata / metadata selectors`, and `conversation`)

## Code Style

- Use full descriptive names for iterator variables — never single-letter shorthands like `s`, `c`, `i` (except `_` for ignored values). E.g. `.map(status => ...)`, `.filter(category => ...)`.
- Use full descriptive names for function parameters — never abbreviated shorthands like `sp`, `req`, `res`, `cb`, `fn`, `e`. E.g. `searchParams` not `sp`, `event` not `e`.
- Use full descriptive names for constants and local variables — avoid vague abbreviations. E.g. `FALLBACK_ERROR_MESSAGE` not `FALLBACK`.
- When asserting or destructuring multiple fields sourced from the same object, keep them in the same order as that object's own property definition — easier to scan and diff against the source.

## Docs

Always use **context7** to fetch up-to-date documentation before working with any library or framework — including Express, React, Prisma, Vite, Bun, shadcn/ui, and the Anthropic SDK. Do not rely on training data alone for API signatures or configuration options.
