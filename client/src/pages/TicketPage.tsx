import { useParams, Link } from 'react-router'
import { TicketPageSkeleton } from '@/components/ticket/TicketPageSkeleton'
import { TicketEditableDetails } from '@/components/ticket/TicketEditableDetails'
import { formatDate } from '@/lib/format-date'
import { getErrorMessage } from '@/lib/api-client'
import { useTicket } from '@/hooks/useTicket'
import { TicketReplyThread } from '@/components/ticket/TicketReplyThread'
import { TicketBody } from '@/components/ticket/TicketBody'

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
              <dl className="space-y-2 text-sm border-l-2 border-border pl-4">
                <div className="flex items-center gap-2 min-h-7">
                  <dt className="w-24 shrink-0 text-muted-foreground">From</dt>
                  <dd>
                    {ticket.fromName} &lt;{ticket.fromEmail}&gt;
                  </dd>
                </div>
                <div className="flex items-center gap-2 min-h-7">
                  <dt className="w-24 shrink-0 text-muted-foreground">Received</dt>
                  <dd>{formatDate(ticket.createdAt, 'datetime')}</dd>
                </div>
                <div className="flex items-center gap-2 min-h-7">
                  <dt className="w-24 shrink-0 text-muted-foreground">Updated</dt>
                  <dd>{formatDate(ticket.updatedAt, 'datetime')}</dd>
                </div>
              </dl>

              <TicketBody body={ticket.body} htmlBody={ticket.htmlBody} iframeTitle="Email body" />

              <TicketReplyThread ticketId={ticket.id} />
            </div>

            <dl className="space-y-2 text-sm">
              <TicketEditableDetails ticket={ticket} />
            </dl>
          </div>
        </div>
      )}
    </>
  )
}
