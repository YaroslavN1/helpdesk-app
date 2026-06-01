import { useEffect, useState } from 'react'
import { TicketsTable, type Ticket } from '@/components/TicketsTable'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tickets', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tickets')
        return res.json() as Promise<Ticket[]>
      })
      .then(setTickets)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
      </div>
      <TicketsTable tickets={tickets} loading={loading} error={error} />
    </>
  )
}
