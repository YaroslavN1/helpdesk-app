# Implementation Plan

## Phase 1 — Project Foundation

- [x] Initialize monorepo structure (`/client`, `/server`, `/core`)
- [x] Set up Express server with TypeScript
- [x] Set up React app with TypeScript
- [x] Set up PostgreSQL database

---

## Phase 2 — Authentication & User Management

- [ ] Configure ESLint and Prettier for both apps
- [x] Set up environment variable config (`.env.example`)
- [x] Set up Prisma with PostgreSQL connection
- [x] Design and write initial database schema (users, sessions, tickets)
- [x] Write and run initial Prisma migrations
- [x] Implement session middleware in Express (Better Auth — create, validate, destroy)
- [x] Build login endpoint (`POST /api/auth/sign-in/email`)
- [x] Build logout endpoint (`POST /api/auth/sign-out`)
- [x] Build "current user" endpoint (Better Auth session API)
- [x] Protect API routes with session middleware (`requireAuth`, `requireAdmin`)
- [x] Create admin seed script (bootstrap first admin account)
- [x] Build agent management endpoints (list, create, edit, soft-delete)
- [x] Build login page in React
- [x] Implement protected route wrapper in React (`ProtectedRoute`, `AdminRoute`)
- [x] Build user management UI (agent list, create/edit agent form)

---

## Phase 3 — Ticket Management Core

- [x] Build ticket CRUD endpoints (create, read, update)
- [x] Implement ticket status transitions (open → resolved → closed)
- [x] Implement ticket category assignment
- [x] Implement ticket assignment to agent
- [x] Build ticket list endpoint with filtering (status, category) and sorting
- [x] Build ticket detail endpoint
- [x] Build ticket list page in React (table with filters and sort controls)
- [x] Build ticket detail page in React (message body, metadata, status controls)
- [x] Build ticket status update controls in UI

---

## Phase 4 — Email Integration

- [ ] Set up SendGrid or Mailgun account and configure inbound email parsing
- [x] Build inbound email webhook endpoint (`POST /api/webhooks/inbound-email`)
- [x] Validate webhook signature (security — `X-Webhook-Secret` header)
- [x] Parse inbound email and create a ticket in the database
- [ ] Build email sending service (wrapper around SendGrid/Mailgun API)
- [ ] Send auto-acknowledgement email when a ticket is created
- [ ] Send closing notification email when a ticket is closed (prompt customer to open new thread)
- [ ] Handle customer replies to existing threads (append message to ticket, reopen if needed)

---

## Phase 5 — AI Features

- [ ] Set up Anthropic Claude API client in backend
- [ ] Build ticket classification service (assign category using Claude)
- [ ] Run classification automatically on new ticket creation
- [ ] Build AI response generation service (draft reply using Claude + confidence score)
- [ ] Define confidence threshold for auto-send vs. escalation
- [ ] Auto-send response if confidence is above threshold
- [ ] Escalate ticket to human agent if confidence is below threshold
- [ ] Build in-app notification system for escalated tickets
- [ ] Build notification bell / indicator in React UI
- [ ] Build AI summary service (summarise ticket thread using Claude)
- [ ] Display AI summary on ticket detail page
- [ ] Display AI-suggested reply on ticket detail page (agents can edit and send)

---

## Phase 6 — Knowledge Base

- [ ] Set up pgvector extension in PostgreSQL
- [ ] Define knowledge base data model (entries, embeddings)
- [ ] Build embedding pipeline (generate pgvector embeddings on knowledge base entry save)
- [ ] Build knowledge base CRUD endpoints (list, create, update, delete — admin only)
- [ ] Build knowledge base management UI (admin)
- [ ] Integrate knowledge base into AI response generation (RAG: retrieve relevant entries before generating reply)
- [ ] Test and tune retrieval quality

---

## Phase 7 — Dashboard

- [ ] Build dashboard stats endpoint (ticket counts by status, recent activity)
- [ ] Build dashboard page in React (open/resolved/closed counts, escalated tickets requiring attention)
- [ ] Add recent tickets feed to dashboard
- [ ] Add escalated tickets queue to dashboard

---

## Phase 8 — Deployment

- [ ] Create `docker-compose.yml` for local development (client, server, postgres)
- [ ] Write `Dockerfile` for frontend (nginx to serve static build)
- [ ] Write `Dockerfile` for backend (Node.js)
- [ ] Write production `docker-compose.yml`
- [ ] Choose cloud provider and provision infrastructure
- [ ] Configure environment secrets on cloud provider
- [ ] Set up domain and TLS
- [ ] Configure inbound email webhook URL on SendGrid/Mailgun
- [ ] Set up CI/CD pipeline (build, test, deploy on merge to main)
- [ ] Deploy and smoke-test full flow end-to-end
