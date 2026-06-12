import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputDebounced } from '@/components/ui/input-debounced'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  type TicketsFilters,
} from '@helpdesk/core'

const ticketsDefaultFilters: TicketsFilters = { search: '', status: [], category: [] }

interface Props {
  filters: TicketsFilters
  onFiltersChange: (filters: TicketsFilters) => void
  loading: boolean
}

const statusOptions = TICKET_STATUSES.map(status => ({ value: status, label: TICKET_STATUS_LABELS[status] }))
const categoryOptions = TICKET_CATEGORIES.map(category => ({ value: category, label: TICKET_CATEGORY_LABELS[category] }))

export function TicketsFilters({ filters, onFiltersChange, loading }: Props) {
  const isFilter = filters.status.length > 0 || filters.category.length > 0 || !!filters.search

  return (
    <div className="mt-6 flex items-center gap-2">
      <InputDebounced
        value={filters.search}
        onChange={search => onFiltersChange({ ...filters, search })}
        placeholder="Search tickets…"
        className="w-56"
        testId="search-input"
      />

      <MultiSelect
        label="Status"
        options={statusOptions}
        selected={filters.status}
        onChange={status => onFiltersChange({ ...filters, status })}
        disabled={loading}
        testId="status-filter"
      />

      <MultiSelect
        label="Category"
        options={categoryOptions}
        selected={filters.category}
        onChange={category => onFiltersChange({ ...filters, category })}
        disabled={loading}
        testId="category-filter"
      />

      {isFilter && (
        <Button variant="ghost" size="default" onClick={() => onFiltersChange(ticketsDefaultFilters)} disabled={loading}>
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
