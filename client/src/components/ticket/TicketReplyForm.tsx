import { useState } from 'react'
import { useCreateReply } from '@/hooks/useReplies'
import { getErrorMessage } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TicketReplyFormProps {
  ticketId: number | undefined
}

export function TicketReplyForm({ ticketId }: TicketReplyFormProps) {
  const createReply = useCreateReply(ticketId)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    createReply.mutate(
      { body },
      {
        onSuccess: () => {
          setBody('')
          setError(null)
        },
        onError: (mutationError) => {
          setError(getErrorMessage(mutationError, 'Failed to send reply'))
        },
      },
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}
      className="space-y-2"
    >
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write a reply..."
        disabled={createReply.isPending}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <div className="flex justify-end">
        <Button type="submit" disabled={createReply.isPending || body.trim().length === 0}>
          Send reply
        </Button>
      </div>
    </form>
  )
}
