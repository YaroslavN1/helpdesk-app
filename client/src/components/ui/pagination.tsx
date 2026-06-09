import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  loading?: boolean
}

function getPageRange(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const distanceToFirst = page - 1
  const distanceToLast = totalPages - page

  const pages: (number | '...')[] = [1]

  if (distanceToFirst > 2) pages.push('...')

  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    pages.push(p)
  }

  if (distanceToLast > 2) pages.push('...')

  pages.push(totalPages)
  return pages
}

export function Pagination({ page, pageSize, total, onPageChange, loading }: Props) {
  const totalPages = Math.ceil(total / pageSize)

  function handlePageChange(newPage: number) {
    if (newPage !== page) onPageChange(newPage)
  }
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between mt-4">
      <p data-testid="pagination-summary" className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div data-testid="pagination-buttons" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          data-testid="pagination-prev"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageRange(page, totalPages).map((pageOrEllipsis, index) =>
          pageOrEllipsis === '...' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">…</span>
          ) : (
            <Button
              key={pageOrEllipsis}
              variant={pageOrEllipsis === page ? 'default' : 'outline'}
              size="icon"
              onClick={() => handlePageChange(pageOrEllipsis)}
              disabled={loading}
              className="h-8 w-8 text-sm"
            >
              {pageOrEllipsis}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          data-testid="pagination-next"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
