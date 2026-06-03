import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import type { SortColumn, TicketsSort } from '@helpdesk/core'

interface Props {
  column: SortColumn
  label: string
  sort: TicketsSort
  loading: boolean
  onSortChange: (column: SortColumn) => void
  className?: string
}

export function SortableHead({ column, label, sort, loading, onSortChange, className }: Props) {
  const isActive = sort.column === column
  return (
    <TableHead className={className}>
      <button
        className="flex items-center gap-1 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        onClick={() => onSortChange(column)}
        disabled={loading}
      >
        {label}
        {isActive && sort.order === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
        {isActive && sort.order === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
        {!isActive && <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </TableHead>
  )
}
