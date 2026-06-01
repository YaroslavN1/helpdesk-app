import { formatDate } from '@/lib/utils'
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
import { TicketStatus, TicketCategory } from '@helpdesk/core'

export type Ticket = {
  id: number
  fromEmail: string
  fromName: string
  subject: string
  status: TicketStatus
  category: TicketCategory | null
  assignedTo: { name: string } | null
  createdAt: string
}

interface Props {
  tickets: Ticket[]
  loading: boolean
  error: string | null
}

function formatCategory(category: TicketCategory): string {
  const raw = category.replace(/_/g, ' ')
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function TicketsTable({ tickets, loading, error }: Props) {
  return (
    <>
      {loading && (
        <div className="mt-6 rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 mt-4">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="mt-6 rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No tickets yet.
                  </TableCell>
                </TableRow>
              )}
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-muted-foreground">#{ticket.id}</TableCell>
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
      )}
    </>
  )
}
