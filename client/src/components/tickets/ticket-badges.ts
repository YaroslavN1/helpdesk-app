import type { BadgeVariant } from '@/components/ui/badge'
import { TicketStatus } from '@helpdesk/core'

export const TICKET_STATUS_BADGE: Record<TicketStatus, { variant: BadgeVariant; className?: string }> = {
  open:     { variant: 'default' },
  resolved: { variant: 'secondary', className: 'text-green-600' },
  closed:   { variant: 'secondary' },
}
