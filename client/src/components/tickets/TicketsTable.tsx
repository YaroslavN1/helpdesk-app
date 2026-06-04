import { formatDate } from '@/lib/utils'
import { SortableHead } from '@/components/ui/sortable-head'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TicketStatus,
  TICKET_CATEGORY_LABELS,
  SORT_ORDERS,
  type Ticket,
  type SortColumn,
  type SortOrder,
  type TicketsSort,
} from '@helpdesk/core'

interface Props {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  sort: TicketsSort
  onSortChange: (sort: TicketsSort) => void
}

const COLUMNS = [
  { sortable: true,  column: 'id',        label: '#',           className: 'w-16' },
  { sortable: true,  column: 'subject',   label: 'Subject' },
  { sortable: true,  column: 'fromName',  label: 'From' },
  { sortable: true,  column: 'status',    label: 'Status' },
  { sortable: true,  column: 'category',  label: 'Category' },
  { sortable: false,                      label: 'Assigned to' },
  { sortable: true,  column: 'createdAt', label: 'Received' },
] as const

export function TicketsTable({ tickets, loading, error, sort, onSortChange }: Props) {
  function handleSortChange(column: string) {
    onSortChange({
      column: column as SortColumn,
      order: column === sort.column
        ? SORT_ORDERS.find(order => order !== sort.order) as SortOrder
        : SORT_ORDERS[0],
    })
  }

  return (
    <>
      <div className="mt-4 rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map(col => (
                <SortableHead
                  key={col.label}
                  {...col}
                  activeColumn={sort.column}
                  activeOrder={sort.order}
                  loading={loading}
                  onSortChange={handleSortChange}
                />
              ))}
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
                    <Badge variant="outline">{TICKET_CATEGORY_LABELS[ticket.category]}</Badge>
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
