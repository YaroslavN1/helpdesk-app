import { SENDER_TYPE_LABELS, type Reply } from '@helpdesk/core'
import { formatDate } from '@/lib/format-date'
import { TicketBody } from './TicketBody'

interface TicketReplyProps {
  reply: Reply
}

export function TicketReply({ reply }: TicketReplyProps) {
  return (
    <div
      key={reply.id}
      className="space-y-1 border-border bg-muted/30 p-4 rounded-lg border shadow-md"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{SENDER_TYPE_LABELS[reply.senderType]}</span>
        {reply.user?.name && <span>({reply.user.name})</span>}
        <span>{formatDate(reply.createdAt, 'datetime')}</span>
      </div>
      <TicketBody body={reply.body} htmlBody={reply.htmlBody} iframeTitle="Reply body" />
    </div>
  )
}
