import { useEffect, useState } from 'react'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { TICKET_DEFAULT_SORT_COLUMN, DEFAULT_SORT_ORDER, type Ticket, type TicketsSort } from '@helpdesk/core'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function fetchTickets(sort: TicketsSort) {
    setLoading(true)
    setError(null)
    fetch(`/api/tickets?sortBy=${sort.column}&sortOrder=${sort.order}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tickets')
        return res.json() as Promise<Ticket[]>
      })
      .then(setTickets)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets({ column: TICKET_DEFAULT_SORT_COLUMN, order: DEFAULT_SORT_ORDER })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
      </div>
      <TicketsTable
        tickets={tickets}
        loading={loading}
        error={error}
        onSortChange={fetchTickets}
      />
    </>
  )
}
