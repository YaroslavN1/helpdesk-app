import { useState } from 'react'
import { Select, type SelectOption } from '@/components/ui/select'
import { type TicketDetails } from '@helpdesk/core'

export type TicketUpdateResult = { updatedTicket: TicketDetails } | { error: string }

interface TicketSelectFieldProps {
  label: string
  value: string | null
  options: SelectOption[]
  updateTicket: (body: Record<string, unknown>) => Promise<TicketUpdateResult>
  mapSelected: (value: string | null) => Record<string, unknown> | null
  className?: string
  'data-testid'?: string
}

export function TicketSelectField({ label, value, options, updateTicket, mapSelected, className, 'data-testid': testId }: TicketSelectFieldProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(newValue: string | null) {
    const body = mapSelected(newValue)
    if (!body) return
    setIsUpdating(true)
    setError(null)
    updateTicket(body)
      .then((result) => { if ('error' in result) setError(result.error) })
      .finally(() => setIsUpdating(false))
  }

  return (
    <div className="flex items-center gap-2">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-1">
        <Select
          value={value}
          options={options}
          onValueChange={handleChange}
          disabled={isUpdating}
          className={className}
          data-testid={testId}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </dd>
    </div>
  )
}
