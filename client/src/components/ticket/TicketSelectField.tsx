import { Select, type SelectOption } from '@/components/ui/select'

interface TicketSelectFieldProps {
  label: string
  value: string | null
  options: SelectOption[]
  onValueChange: (value: string | null) => void
  disabled?: boolean
  error?: string | null
  className?: string
  'data-testid'?: string
}

export function TicketSelectField({
  label,
  value,
  options,
  onValueChange,
  disabled,
  error,
  className,
  'data-testid': testId,
}: TicketSelectFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-1">
        <Select
          value={value}
          options={options}
          onValueChange={onValueChange}
          disabled={disabled}
          className={className}
          data-testid={testId}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </dd>
    </div>
  )
}
