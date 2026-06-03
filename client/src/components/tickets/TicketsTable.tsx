import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { SortableHead } from './SortableHead'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TicketStatus, TicketCategory, TICKET_DEFAULT_SORT_COLUMN, DEFAULT_SORT_ORDER, SORT_ORDERS, type Ticket, type SortColumn, type SortOrder, type TicketsSort } from '@helpdesk/core'

interface Props {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  onSortChange: (sort: TicketsSort) => void
}

function formatCategory(category: TicketCategory): string {
  const raw = category.replace(/_/g, ' ')
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}


export function TicketsTable({ tickets, loading, error, onSortChange }: Props) {
  const [sort, setSort] = useState<TicketsSort>({
    column: TICKET_DEFAULT_SORT_COLUMN,
    order: DEFAULT_SORT_ORDER,
  })

  function handleSortChange(column: SortColumn) {
    const newSort: TicketsSort = {
      column,
      order: column === sort.column
        ? SORT_ORDERS.find(order => order !== sort.order) as SortOrder
        : SORT_ORDERS[0],
    }
    setSort(newSort)
    onSortChange(newSort)
  }

  return (
    <>
      <div className="mt-6 rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="id" label="#" sort={sort} loading={loading} onSortChange={handleSortChange} className="w-16" />
              <SortableHead column="subject" label="Subject" sort={sort} loading={loading} onSortChange={handleSortChange} />
              <SortableHead column="fromName" label="From" sort={sort} loading={loading} onSortChange={handleSortChange} />
              <SortableHead column="status" label="Status" sort={sort} loading={loading} onSortChange={handleSortChange} />
              <SortableHead column="category" label="Category" sort={sort} loading={loading} onSortChange={handleSortChange} />
              <TableHead>Assigned to</TableHead>
              <SortableHead column="createdAt" label="Received" sort={sort} loading={loading} onSortChange={handleSortChange} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            )}
            {!loading && tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No tickets yet.
                </TableCell>
              </TableRow>
            )}
            {!loading && tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-muted-foreground">{ticket.id}</TableCell>
                <TableCell className="font-medium max-w-xs truncate">{ticket.subject}</TableCell>
                <TableCell>
                  <div className="text-sm">{ticket.fromName}</div>
                  <div className="text-xs text-muted-foreground">{ticket.fromEmail}</div>
                </TableCell>
                <TableCell>
                  {ticket.status === TicketStatus.open && (
                    <Badge variant="default">{ticket.status}</Badge>
                  )}
                  {ticket.status === TicketStatus.resolved && (
                    <Badge variant="secondary" className="text-green-600">{ticket.status}</Badge>
                  )}
                  {ticket.status === TicketStatus.closed && (
                    <Badge variant="secondary">{ticket.status}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {ticket.category ? (
                    <Badge variant="outline">{formatCategory(ticket.category)}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {ticket.assignedTo?.name ?? <span className="italic">Unassigned</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(ticket.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 mt-4">
          {error}
        </p>
      )}
    </>
  )
}
