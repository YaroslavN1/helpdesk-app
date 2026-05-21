# Implementation Plan

## Phase 1 — Project Foundation

- [ ] Initialize monorepo structure (`/client`, `/server`)
- [ ] Set up Express server with TypeScript
- [ ] Set up React app with TypeScript
- [ ] Set up PostgreSQL database

---

## Phase 2 — Authentication & User Management

- [ ] Configure ESLint and Prettier for both apps
- [ ] Set up environment variable config (`.env.example` for both apps)
- [ ] Set up Prisma with PostgreSQL connection
- [ ] Design and write initial database schema (users, sessions, tickets)
- [ ] Write and run initial Prisma migrations
- [ ] Implement session middleware in Express (create, validate, destroy)
- [ ] Build login endpoint (`POST /auth/login`)
- [ ] Build logout endpoint (`POST /auth/logout`)
- [ ] Build "current user" endpoint (`GET /auth/me`)
- [ ] Protect API routes with session middleware
- [ ] Create admin seed script (bootstrap first admin account)
- [ ] Build agent management endpoints (list, create, deactivate)
- [ ] Build login page in React
- [ ] Implement protected route wrapper in React
- [ ] Build user management UI (agent list, create agent form)

---

## Phase 3 — Ticket Management Core

- [ ] Build ticket CRUD endpoints (create, read, update)
- [ ] Implement ticket status transitions (open → resolved → closed)
- [ ] Implement ticket category assignment
- [ ] Implement ticket assignment to agent
- [ ] Build ticket list endpoint with filtering (status, category, assignee) and sorting
- [ ] Build ticket detail endpoint
- [ ] Build ticket list page in React (table with filters and sort controls)
- [ ] Build ticket detail page in React (timeline view of messages, status controls)
- [ ] Build ticket status update controls in UI

---

## Phase 4 — Email Integration

- [ ] Set up SendGrid or Mailgun account and configure inbound email parsing
- [ ] Build inbound email webhook endpoint (`POST /webhooks/inbound-email`)
- [ ] Validate webhook signature (security)
- [ ] Parse inbound email and create a ticket + first message in the database
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
