import type { BadgeVariant } from '@/components/ui/badge'
import { TicketStatus, TicketCategory } from '@helpdesk/core'

export const TICKET_STATUS_BADGE: Record<TicketStatus, { variant: BadgeVariant; className?: string }> = {
  open:     { variant: 'default' },
  resolved: { variant: 'secondary', className: 'text-green-600' },
  closed:   { variant: 'secondary' },
}

export const TICKET_CATEGORY_BADGE: Record<TicketCategory | 'null', { variant: BadgeVariant }> = {
  general_question:   { variant: 'outline' },
  technical_question: { variant: 'outline' },
  refund_request:     { variant: 'outline' },
  null:               { variant: 'ghost'   },
}
