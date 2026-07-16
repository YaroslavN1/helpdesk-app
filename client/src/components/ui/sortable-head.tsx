import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'

interface Props {
  label: string
  sortable?: boolean
  column?: string
  activeColumn?: string
  activeOrder?: 'asc' | 'desc'
  loading?: boolean
  onSortChange?: (column: string) => void
  className?: string
}

export function SortableHead({
  label,
  sortable = true,
  column,
  activeColumn,
  activeOrder,
  loading,
  onSortChange,
  className,
}: Props) {
  if (!sortable) {
    return <TableHead className={className}>{label}</TableHead>
  }

  const isActive = activeColumn === column
  return (
    <TableHead className={className}>
      <button
        className="flex items-center gap-1 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        onClick={() => onSortChange!(column!)}
        disabled={loading}
      >
        {label}
        {isActive && activeOrder === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
        {isActive && activeOrder === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
        {!isActive && <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </TableHead>
  )
}
