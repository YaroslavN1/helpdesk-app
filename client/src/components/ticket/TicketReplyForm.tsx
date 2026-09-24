import { useState } from 'react'
import { useCreateReply, usePolishReply } from '@/hooks/useReplies'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ErrorMessage } from '@/components/ui/error-message'
import { MAX_REPLY_BODY_LENGTH } from '@helpdesk/core'
import { Brush, BrushCleaning, BrushCleaningIcon, Feather, LoaderCircle } from 'lucide-react'
interface TicketReplyFormProps {
  ticketId: number | undefined
}

export function TicketReplyForm({ ticketId }: TicketReplyFormProps) {
  const createReply = useCreateReply(ticketId)
  const polishReply = usePolishReply(ticketId)
  const [body, setBody] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [polishError, setPolishError] = useState<string | null>(null)

  function handleSubmit() {
    createReply.mutate(
      { body },
      {
        onSuccess: () => {
          setBody('')
          setSubmitError(null)
        },
        onError: (mutationError) => {
          setSubmitError(getErrorMessage(mutationError, 'Failed to send reply'))
        },
      },
    )
  }

  function handlePolishReply() {
    polishReply.mutate(body, {
      onSuccess: (polishedReply) => {
        setBody(polishedReply.body)
        setPolishError(null)
      },
      onError: (mutationError) =>
        setPolishError(getErrorMessage(mutationError, 'Failed to polish reply')),
    })
  }

  const isPending = createReply.isPending || polishReply.isPending

  const isOverLimit = body.length >= MAX_REPLY_BODY_LENGTH

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
        disabled={isPending}
        maxLength={MAX_REPLY_BODY_LENGTH}
        aria-invalid={Boolean(submitError)}
      />

      <ErrorMessage error={submitError} />
      <ErrorMessage error={polishError} />

      <div className="flex justify-between gap-2">
        <span className={cn('text-xs', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}>
          {body.length} / {MAX_REPLY_BODY_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {isPending && <LoaderCircle size={20} className="animate-spin" />}
          <Button
            type="button"
            onClick={handlePolishReply}
            disabled={isPending || body.trim().length === 0}
          >
            <Feather />
            Polish
          </Button>
          <Button type="submit" disabled={isPending || isOverLimit || body.trim().length === 0}>
            Send reply
          </Button>
        </div>
      </div>
    </form>
  )
}
