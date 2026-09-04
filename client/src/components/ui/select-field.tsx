import { Select, type SelectOption } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface SelectFieldProps {
  label: string
  value: string | null
  options: SelectOption[]
  onValueChange: (value: string | null) => void
  disabled?: boolean
  error?: string | null
  className?: string
  'data-testid'?: string
}

export function SelectField({
  label,
  value,
  options,
  onValueChange,
  disabled,
  error,
  className,
  'data-testid': testId,
}: SelectFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 shrink-0 font-normal text-muted-foreground">{label}</Label>
      <div className="flex flex-col gap-1">
        <Select
          value={value}
          options={options}
          onValueChange={onValueChange}
          disabled={disabled}
          className={className}
          data-testid={testId}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  )
}
