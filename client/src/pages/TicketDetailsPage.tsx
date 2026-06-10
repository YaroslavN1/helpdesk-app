import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Select, type SelectOption } from '@/components/ui/select'
import { TicketDetailsSkeleton } from '@/components/tickets/TicketDetailsSkeleton'
import { TICKET_STATUS_BADGE, TICKET_CATEGORY_BADGE } from '@/components/tickets/ticket-badges'
import { formatDate } from '@/lib/utils'
import { type TicketDetails, type AgentOption } from '@helpdesk/core'

function mappedAgentOptions(agents: AgentOption[]): SelectOption[] {
  return [
    { value: null, label: 'Unassigned' },
    ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
  ]
}

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setTicket(null)
    setError(null)
    Promise.all([
      fetch(`/api/tickets/${id}`, { credentials: 'include' }).then((response) => {
        if (!response.ok) {
          if (response.status === 404) throw new Error('Ticket not found')
          throw new Error('Failed to load ticket')
        }
        return response.json() as Promise<TicketDetails>
      }),
      fetch('/api/users/agents', { credentials: 'include' }).then((response) =>
        response.ok ? (response.json() as Promise<AgentOption[]>) : [],
      ),
    ])
      .then(([ticketData, agentsData]) => {
        setTicket(ticketData)
        setAgents(agentsData)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [id])

  function handleAssign(value: string | null) {
    const assignedToId = value
    setIsAssigning(true)
    setAssignError(null)
    fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToId }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to update assignment')
        return response.json() as Promise<TicketDetails>
      })
      .then((updated) => setTicket(updated))
      .catch((err: unknown) =>
        setAssignError(err instanceof Error ? err.message : 'Unknown error'),
      )
      .finally(() => setIsAssigning(false))
  }

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

          <dl className="space-y-2 text-sm border-l-2 border-border pl-4">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">From</dt>
              <dd>{ticket.fromName} &lt;{ticket.fromEmail}&gt;</dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Assigned to</dt>
              <dd className="flex flex-col gap-1">
                <Select
                  value={ticket.assignedTo?.id ?? null}
                  options={mappedAgentOptions(agents)}
                  onValueChange={handleAssign}
                  disabled={isAssigning}
                  className="h-7 w-48 text-sm"
                />
                {assignError && (
                  <span className="text-xs text-destructive">{assignError}</span>
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
