import { useState } from 'react'
import { SENDER_TYPE_LABELS } from '@helpdesk/core'
import { useCreateReply, useReplies } from '@/hooks/useReplies'
import { formatDate } from '@/lib/format-date'
import { getErrorMessage } from '@/lib/api-client'
import { TicketReplyForm } from './TicketReplyForm'

interface TicketRepliesProps {
  ticketId: number | undefined
}

export function TicketReplies({ ticketId }: TicketRepliesProps) {
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
        <div
          key={reply.id}
          className="space-y-1 border-border bg-muted/30 p-4 rounded-lg border shadow-md"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{SENDER_TYPE_LABELS[reply.senderType]}</span>
            {reply.user?.name && <span>({reply.user.name})</span>}
            <span>{formatDate(reply.createdAt, 'datetime')}</span>
          </div>
          {reply.htmlBody ? (
            <iframe
              srcDoc={reply.htmlBody}
              sandbox="allow-same-origin"
              className="w-full min-h-32 bg-white"
              title="Reply body"
            />
          ) : (
            <div className="whitespace-pre-wrap pt-2 text-sm">{reply.body}</div>
          )}
        </div>
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
