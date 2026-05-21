# Tech Stack

## Frontend
- **Framework:** React (TypeScript)
- **Styling:** Shadcn/Tailwind CSS

## Backend
- **Runtime:** Node.js
- **Framework:** Express.js (TypeScript)

## Database
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Vector search:** pgvector extension (for knowledge base semantic search)

## Authentication
- Database sessions (session stored in PostgreSQL, session token in HTTP-only cookie)

## Email
- **Provider:** SendGrid or Mailgun (TBD)
  - Inbound email parsing via webhook for receiving support emails
  - Transactional sending for auto-replies and closing notifications

## AI
- **Provider:** Anthropic Claude API
- **Model:** claude-sonnet-4-6
- **Use cases:** ticket classification, response generation, confidence scoring, AI summaries

## Deployment
- **Containerization:** Docker (separate containers for frontend, backend, and database)
- **Cloud provider:** TBD

## Open Decisions
- SendGrid vs. Mailgun
- Cloud provider
- Knowledge base structure and management
- GDPR / CCPA compliance requirements
