import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { TicketDetailsSkeleton } from '@/components/tickets/TicketDetailsSkeleton'
import { TicketFieldsEditor } from '@/components/tickets/TicketFieldsEditor'
import { formatDate } from '@/lib/utils'
import { type TicketDetails } from '@helpdesk/core'
import { type TicketUpdateResult } from '@/components/tickets/TicketSelectField'

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function updateTicket(body: Record<string, unknown>): Promise<TicketUpdateResult> {
    let updatedTicket: TicketDetails
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('Failed to update ticket')
      updatedTicket = await response.json() as TicketDetails
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
    setTicket(updatedTicket)
    return { updatedTicket }
  }

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
      .then(setTicket)
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
          <h2 className="text-2xl font-bold tracking-tight">
            <span className="text-muted-foreground/70 font-normal">#{ticket.id}</span> {ticket.subject}
          </h2>

          <dl className="space-y-2 text-sm border-l-2 border-border pl-4">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">From</dt>
              <dd>{ticket.fromName} &lt;{ticket.fromEmail}&gt;</dd>
            </div>

            <TicketFieldsEditor ticket={ticket} updateTicket={updateTicket} />

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
