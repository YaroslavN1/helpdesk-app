import { formatDate } from '@/lib/format-date'
import { type TicketDetails as TicketDetailsType } from '@helpdesk/core'
import { TicketBody } from './TicketBody'
import { TicketDetail } from './TicketDetail'

interface TicketDetailsProps {
  ticket: TicketDetailsType
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  return (
    <>
      <dl className="space-y-2 text-sm border-l-2 border-border pl-4">
        <TicketDetail title="From" data={`${ticket.fromName} <${ticket.fromEmail}>`} />
        <TicketDetail title="Received" data={formatDate(ticket.createdAt, 'datetime')} />
        <TicketDetail title="Updated" data={formatDate(ticket.updatedAt, 'datetime')} />
      </dl>

      <div className="bg-muted/30 p-4 rounded-lg border shadow-md">
        <TicketBody body={ticket.body} htmlBody={ticket.htmlBody} iframeTitle="Email body" />
      </div>
    </>
  )
}
