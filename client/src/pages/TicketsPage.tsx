import { TicketsFilters } from '@/components/tickets/TicketsFilters'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { Pagination } from '@/components/ui/pagination'
import { defaultPage, useTicketsUrlParams } from '@/hooks/useTicketsUrlParams'
import { useTickets } from '@/hooks/useTickets'
import { getErrorMessage } from '@/lib/api-client'
import {
  DEFAULT_PAGE_SIZE,
  type TicketsSortCriteria,
  type TicketsFilterCriteria,
} from '@helpdesk/core'

export default function TicketsPage() {
  const { sort, filters, page, setUrlParams } = useTicketsUrlParams()
  const { data, isPending, error } = useTickets({ sort, filters, page })

  function handleFiltersChange(newFilters: TicketsFilterCriteria) {
    setUrlParams({ sort, filters: newFilters, page: defaultPage })
  }

  function handleSortChange(newSort: TicketsSortCriteria) {
    setUrlParams({ sort: newSort, filters, page: defaultPage })
  }

  function handlePageChange(newPage: number) {
    setUrlParams({ sort, filters, page: newPage })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
      </div>
      <TicketsFilters filters={filters} onFiltersChange={handleFiltersChange} loading={isPending} />
      <TicketsTable
        tickets={data?.tickets ?? []}
        loading={isPending}
        error={getErrorMessage(error, 'Failed to load tickets')}
        sort={sort}
        onSortChange={handleSortChange}
      />
      <Pagination
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={handlePageChange}
        loading={isPending}
      />
    </>
  )
}
