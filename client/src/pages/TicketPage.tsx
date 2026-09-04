import { useParams, Link } from 'react-router'
import { TicketPageSkeleton } from '@/components/ticket/TicketPageSkeleton'
import { TicketEditableDetails } from '@/components/ticket/TicketEditableDetails'
import { getErrorMessage } from '@/lib/api-client'
import { useTicket } from '@/hooks/useTicket'
import { TicketReplyThread } from '@/components/ticket/TicketReplyThread'
import { TicketDetails } from '@/components/ticket/TicketDetails'

export default function TicketPage() {
  const { id } = useParams<{ id: string }>()
  const { data: ticket, isPending, error } = useTicket(id)

  return (
    <>
      <Link
        to="/tickets"
        className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        ← Tickets
      </Link>

      {isPending && <TicketPageSkeleton />}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {getErrorMessage(error, 'Failed to load ticket')}
        </p>
      )}

      {!isPending && ticket && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">
            <span className="text-muted-foreground/70 font-normal">#{ticket.id}</span>{' '}
            {ticket.subject}
          </h2>

          <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
            <div className="space-y-6 min-w-0">
              <TicketDetails ticket={ticket} />

              <TicketReplyThread ticketId={ticket.id} />
            </div>

            <div className="space-y-2">
              <TicketEditableDetails ticket={ticket} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
