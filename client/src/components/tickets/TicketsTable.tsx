import { Link, useNavigate } from 'react-router'
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
import { TICKET_STATUS_BADGE, TICKET_CATEGORY_BADGE } from '@/components/tickets/ticket-badges'
import {
  SORT_ORDERS,
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  type Ticket,
  type TicketSortColumn,
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

const SKELETON_CELLS = [
  'h-4 w-8',
  'h-4 w-48',
  'h-4 w-36',
  'h-5 w-14 rounded-full',
  'h-5 w-28 rounded-full',
  'h-4 w-24',
  'h-4 w-24',
]

const COLUMNS = [
  { sortable: true,  column: 'id',        label: 'Id',          className: 'w-16' },
  { sortable: true,  column: 'subject',   label: 'Subject' },
  { sortable: true,  column: 'fromName',  label: 'From' },
  { sortable: true,  column: 'status',    label: 'Status' },
  { sortable: true,  column: 'category',  label: 'Category' },
  { sortable: false,                      label: 'Assigned to' },
  { sortable: true,  column: 'createdAt', label: 'Received' },
] as const


export function TicketsTable({ tickets, loading, error, sort, onSortChange }: Props) {
  const navigate = useNavigate()

  function handleSortChange(column: string) {
    onSortChange({
      column: column as TicketSortColumn,
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
              {COLUMNS.map(column => (
                <SortableHead
                  key={column.label}
                  {...column}
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
                  {SKELETON_CELLS.map((className, index) => (
                    <TableCell key={index}><Skeleton className={className} /></TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {!loading && tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center text-muted-foreground py-8">
                  No tickets yet.
                </TableCell>
              </TableRow>
            )}
            {!loading && tickets.map((ticket) => (
              <TableRow key={ticket.id} className="cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                <TableCell className="font-mono text-muted-foreground">{ticket.id}</TableCell>
                <TableCell className="max-w-xs">
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {ticket.subject}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{ticket.fromName}</div>
                  <div className="text-xs text-muted-foreground">{ticket.fromEmail}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={TICKET_STATUS_BADGE[ticket.status].variant}
                    className={TICKET_STATUS_BADGE[ticket.status].className}
                  >
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={TICKET_CATEGORY_BADGE[ticket.category ?? 'null'].variant}>
                    {ticket.category ? TICKET_CATEGORY_LABELS[ticket.category] : '—'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {ticket.assignedTo
                    ? <span className="font-medium">{ticket.assignedTo.name}</span>
                    : <span className="italic text-muted-foreground/40">Unassigned</span>
                  }
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
