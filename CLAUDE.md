# Helpdesk — Project Memory

## Overview
AI-powered ticket management system. Customers submit issues via email; the system creates tickets automatically, classifies them, and uses Claude AI to generate responses. High-confidence responses are sent automatically; low-confidence tickets are escalated to a human agent.

See `project-planning/` for full scope, tech stack decisions, and implementation plan.

## Tech Stack
- **Runtime / package manager:** Bun
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Express 5, TypeScript (run directly with Bun)
- **Database:** PostgreSQL, Prisma ORM, pgvector extension
- **Auth:** Database sessions (HTTP-only cookie)
- **Email:** SendGrid or Mailgun (TBD) — inbound webhook + transactional sending
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`)
- **Deployment:** Docker + cloud provider (TBD)

## Project Structure
```
/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── vite.config.ts    # proxies /api → localhost:3000
│   └── tsconfig.json
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

## Docs
Always use **context7** to fetch up-to-date documentation before working with any library or framework — including Express, React, Prisma, Vite, Bun, and the Anthropic SDK. Do not rely on training data alone for API signatures or configuration options.
