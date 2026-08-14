import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TicketReplyFormProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  error?: string | null
}

export function TicketReplyForm({
  value,
  onChange,
  onSubmit,
  disabled,
  error,
}: TicketReplyFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="space-y-2"
    >
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write a reply..."
        disabled={disabled}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || value.trim().length === 0}>
          Send reply
        </Button>
      </div>
    </form>
  )
}
