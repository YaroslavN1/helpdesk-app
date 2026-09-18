import { useReplies } from '@/hooks/useReplies'
import { TicketReplyForm } from '@/components/ticket/TicketReplyForm'
import { TicketReply } from './TicketReply'

interface TicketReplyThreadProps {
  ticketId: number | undefined
}

export function TicketReplyThread({ ticketId }: TicketReplyThreadProps) {
  const { data: replies, isLoading } = useReplies(ticketId)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold">Replies</h3>

      {isLoading && <p className="text-sm text-muted-foreground">Loading replies...</p>}

      {replies && replies.length === 0 && (
        <p className="text-sm text-muted-foreground">No replies yet.</p>
      )}

      {replies?.map((reply) => (
        <TicketReply key={reply.id} reply={reply} />
      ))}

      <TicketReplyForm ticketId={ticketId} />
    </div>
  )
}
