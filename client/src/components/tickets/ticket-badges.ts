import type { BadgeVariant } from '@/components/ui/badge'
import { TicketStatus, TicketCategory } from '@helpdesk/core'

export const TICKET_STATUS_BADGE: Record<TicketStatus, { label: string; variant: BadgeVariant; className?: string }> = {
  open:     { label: 'Open',     variant: 'default' },
  resolved: { label: 'Resolved', variant: 'secondary', className: 'text-green-600' },
  closed:   { label: 'Closed',   variant: 'secondary' },
}

export const TICKET_CATEGORY_BADGE: Record<TicketCategory | 'null', { label: string; variant: BadgeVariant }> = {
  general_question:   { label: 'General question',   variant: 'outline' },
  technical_question: { label: 'Technical question', variant: 'outline' },
  refund_request:     { label: 'Refund request',     variant: 'outline' },
  null:               { label: '—',                  variant: 'ghost'   },
}
