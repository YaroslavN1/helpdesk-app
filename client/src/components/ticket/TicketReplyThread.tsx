import { useState } from 'react'
import { useCreateReply, useReplies } from '@/hooks/useReplies'
import { getErrorMessage } from '@/lib/api-client'
import { TicketReplyForm } from '@/components/ticket/TicketReplyForm'
import { TicketReply } from './TicketReply'

interface TicketReplyThreadProps {
  ticketId: number | undefined
}

export function TicketReplyThread({ ticketId }: TicketReplyThreadProps) {
  const { data: replies, isLoading } = useReplies(ticketId)
  const createReply = useCreateReply(ticketId)
  const [body, setBody] = useState('')

  function handleSubmit() {
    createReply.mutate({ body }, { onSuccess: () => setBody('') })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Replies</h3>

      {isLoading && <p className="text-sm text-muted-foreground">Loading replies...</p>}

      {replies && replies.length === 0 && (
        <p className="text-sm text-muted-foreground">No replies yet.</p>
      )}

      {replies?.map((reply) => (
        <TicketReply key={reply.id} reply={reply} />
      ))}

      <TicketReplyForm
        value={body}
        onChange={setBody}
        onSubmit={handleSubmit}
        disabled={createReply.isPending}
        error={
          createReply.isError ? getErrorMessage(createReply.error, 'Failed to send reply') : null
        }
      />
    </div>
  )
}
