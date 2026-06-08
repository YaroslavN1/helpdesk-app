import { formatDate } from '@/lib/utils'
import { SortableHead } from '@/components/ui/sortable-head'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
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
  TicketCategory,
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

const TICKET_STATUS_BADGE: Record<TicketStatus, { label: string; variant: BadgeVariant; className: string | undefined }> = {
  open:     { label: 'Open',     variant: 'default',   className: undefined },
  resolved: { label: 'Resolved', variant: 'secondary', className: 'text-green-600' },
  closed:   { label: 'Closed',   variant: 'secondary', className: undefined },
}

const TICKET_CATEGORY_BADGE: Record<TicketCategory | 'null', { label: string; variant: BadgeVariant }> = {
  general_question:  { label: 'General question',  variant: 'outline' },
  technical_question: { label: 'Technical question', variant: 'outline' },
  refund_request:    { label: 'Refund request',    variant: 'outline' },
  null:              { label: '—',                 variant: 'ghost'   },
}

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
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-muted-foreground">{ticket.id}</TableCell>
                <TableCell className="font-medium max-w-xs truncate">{ticket.subject}</TableCell>
                <TableCell>
                  <div className="text-sm">{ticket.fromName}</div>
                  <div className="text-xs text-muted-foreground">{ticket.fromEmail}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={TICKET_STATUS_BADGE[ticket.status].variant}
                    className={TICKET_STATUS_BADGE[ticket.status].className}
                  >
                    {TICKET_STATUS_BADGE[ticket.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={TICKET_CATEGORY_BADGE[ticket.category ?? 'null'].variant}>
                    {TICKET_CATEGORY_BADGE[ticket.category ?? 'null'].label}
                  </Badge>
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
