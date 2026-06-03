import { prisma } from '../src/lib/prisma'
import { TicketStatus, TicketCategory } from '@helpdesk/core'

const statuses = [TicketStatus.open, TicketStatus.resolved, TicketStatus.closed]
const categories = [TicketCategory.general_question, TicketCategory.technical_question, TicketCategory.refund_request, null]

const subjects = [
  'Cannot reset my password',
  'App crashes on startup',
  'Billing charge I don\'t recognize',
  'How do I export my data?',
  'Feature request: dark mode',
  'Login button not responding',
  'Refund request for last month',
  'Two-factor auth not working',
  'Dashboard shows wrong numbers',
  'How do I add a team member?',
  'Email notifications stopped',
  'Account locked after failed attempts',
  'Integration with Slack broken',
  'CSV import fails silently',
  'Search returns no results',
  'Profile picture won\'t upload',
  'Payment method update failing',
  'Subscription plan confusion',
  'API rate limit too low',
  'Missing data after migration',
]

const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Iris', 'James',
  'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tara']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'White', 'Harris']

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.io', 'example.com', 'acme.org']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysBack: number): Date {
  const ms = Date.now() - Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000)
  return new Date(ms)
}

const existing = await prisma.ticket.count()
if (existing >= 100) {
  console.log(`Already have ${existing} tickets, skipping.`)
  process.exit(0)
}

const tickets = Array.from({ length: 100 }, (_, i) => {
  const first = pick(firstNames)
  const last = pick(lastNames)
  const name = `${first} ${last}`
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@${pick(domains)}`
  const subject = `${pick(subjects)} (#${i + 1})`
  const body = `Hi support,\n\nI'm writing about the following issue: ${subject}.\n\nPlease help me resolve this as soon as possible.\n\nThanks,\n${name}`
  const category = pick(categories)

  return {
    fromEmail: email,
    fromName: name,
    subject,
    body,
    status: pick(statuses),
    category,
    createdAt: randomDate(90),
  }
})

await prisma.ticket.createMany({ data: tickets })
console.log(`Created 100 tickets.`)
