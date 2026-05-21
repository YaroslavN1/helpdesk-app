## Problem
- Right now submitted problems or questions by email are processes by human agents
- Processing each ticket takes time
- Questions even with repetitive answers still take time
- Lack of ability to respond to simple questions/problems any time because of working hours
- Email responses look copy/paste because of pre-made templates

## Solution
- AI-Powered ticket management system. A service that can process the emails and create tickets automatically. A service that can help with repetitive questions/problems by answering by itself based on knowledge base. It should escalate the issue to a human agent, when the situation requires to.

## Features
- Receive support emails and create tickets
- Auto-generate human-friendly responses using a knowledge base
- Ticket list with filtering and sorting
- Ticket detail view
- AI-powered ticket classification
- AI summaries
- AI-suggested replies
- User management
- Dashboard to view and manage all tickets

## Decisions & Constraints

### Email Integration
- Emails arrive via the company's support desk email address, redirected into the system (exact redirection mechanism TBD)
- All customer communication happens exclusively via email — no customer portal
- No attachment support in the initial version
- When a ticket is closed, the customer receives a closing email notifying them to start a new email thread if the issue recurs; replies to closed tickets do not reopen them

### AI Behavior
- The AI is authorized to send responses directly to customers without human review
- When AI confidence is low, the ticket is automatically escalated to a human agent instead of sending an auto-response
- Human agents receive in-app notifications for escalated tickets

### Knowledge Base
- To be defined

### User Management & Roles
- Single-organization deployment
- System is bootstrapped with one admin account
- Admin can create and manage additional agent accounts
- No multi-tenant support

### Tickets
- **Statuses:** open, resolved, closed
  - *Open* — ticket is active and awaiting a response
  - *Resolved* — the AI or agent has marked the issue as answered
  - *Closed* — the customer has confirmed the issue is resolved
- **Categories:** general question, technical question, refund request

### Escalation & SLAs
- Escalation is triggered by low AI confidence
- No SLA requirements in the initial version

### Integrations
- No external tool integrations (no CRM, Slack, Jira, etc.)

### Compliance
- GDPR and CCPA requirements to be defined
