import { formatDate } from '@/lib/format-date'
import { type TicketDetails as TicketDetailsType } from '@helpdesk/core'
import { TicketBody } from './TicketBody'

interface TicketDetailsProps {
  ticket: TicketDetailsType
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  return (
    <>
      <dl className="space-y-2 text-sm border-l-2 border-border pl-4">
        <div className="flex items-center gap-2 min-h-7">
          <dt className="w-24 shrink-0 text-muted-foreground">From</dt>
          <dd>
            {ticket.fromName} &lt;{ticket.fromEmail}&gt;
          </dd>
        </div>
        <div className="flex items-center gap-2 min-h-7">
          <dt className="w-24 shrink-0 text-muted-foreground">Received</dt>
          <dd>{formatDate(ticket.createdAt, 'datetime')}</dd>
        </div>
        <div className="flex items-center gap-2 min-h-7">
          <dt className="w-24 shrink-0 text-muted-foreground">Updated</dt>
          <dd>{formatDate(ticket.updatedAt, 'datetime')}</dd>
        </div>
      </dl>

      <div className="bg-muted/30 p-4 rounded-lg border shadow-md">
        <TicketBody body={ticket.body} htmlBody={ticket.htmlBody} iframeTitle="Email body" />
      </div>
    </>
  )
}
