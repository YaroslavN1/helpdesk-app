import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { TicketDetailsSkeleton } from '@/components/tickets/TicketDetailsSkeleton'
import { TICKET_STATUS_BADGE, TICKET_CATEGORY_BADGE } from '@/components/tickets/ticket-badges'
import { formatDate } from '@/lib/utils'
import { type TicketDetails } from '@helpdesk/core'

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setTicket(null)
    setError(null)
    fetch(`/api/tickets/${id}`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 404) throw new Error('Ticket not found')
          throw new Error('Failed to load ticket')
        }
        return response.json() as Promise<TicketDetails>
      })
      .then((data) => setTicket(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <>
      <Link
        to="/tickets"
        className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        ← Tickets
      </Link>

      {loading && <TicketDetailsSkeleton />}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!loading && ticket && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              <span className="text-muted-foreground/70 font-normal">#{ticket.id}</span> {ticket.subject}
            </h2>
            <div className="flex items-center gap-2">
              <Badge
                variant={TICKET_STATUS_BADGE[ticket.status].variant}
                className={TICKET_STATUS_BADGE[ticket.status].className}
              >
                {TICKET_STATUS_BADGE[ticket.status].label}
              </Badge>
              {ticket.category && (
                <Badge variant={TICKET_CATEGORY_BADGE[ticket.category].variant}>
                  {TICKET_CATEGORY_BADGE[ticket.category].label}
                </Badge>
              )}
            </div>
          </div>

          <dl className="space-y-1 text-sm border-l-2 border-border pl-4">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">From</dt>
              <dd>{ticket.fromName} &lt;{ticket.fromEmail}&gt;</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Assigned to</dt>
              <dd>
                {ticket.assignedTo?.name ?? (
                  <span className="italic text-muted-foreground">Unassigned</span>
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Received</dt>
              <dd>{formatDate(ticket.createdAt)}</dd>
            </div>
          </dl>

          {ticket.htmlBody ? (
            <iframe
              srcDoc={ticket.htmlBody}
              sandbox="allow-same-origin"
              className="w-full min-h-96 rounded-lg border bg-white shadow-md"
              title="Email body"
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm rounded-lg border p-4 bg-muted/30 shadow-md">
              {ticket.body}
            </div>
          )}
        </div>
      )}
    </>
  )
}
