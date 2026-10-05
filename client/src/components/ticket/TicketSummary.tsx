import { useSummarizeTicket } from '@/hooks/useTicket'
import { getErrorMessage } from '@/lib/api-client'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/ui/error-message'

interface TicketSummaryProps {
  ticketId: number
}

export function TicketSummary({ ticketId }: TicketSummaryProps) {
  const summarizeTicket = useSummarizeTicket(ticketId)
  const [summary, setSummary] = useState<string | null>(null)
  const [summarizeError, setSummarizeError] = useState<string | null>(null)

  function handleSummarize() {
    summarizeTicket.mutate(undefined, {
      onSuccess: (result) => {
        setSummary(result.body)
        setSummarizeError(null)
      },
      onError: (mutationError) => {
        setSummary(null)
        setSummarizeError(getErrorMessage(mutationError, 'Failed to summarize ticket'))
      },
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSummarize} disabled={summarizeTicket.isPending}>
          <Sparkles />
          Summarize
        </Button>
        {summarizeTicket.isPending && <LoaderCircle size={20} className="animate-spin" />}
      </div>

      <ErrorMessage error={summarizeError} />

      {summary && (
        <p className="bg-muted/30 p-4 rounded-lg border shadow-md text-sm whitespace-pre-wrap">
          {summary}
        </p>
      )}
    </div>
  )
}
