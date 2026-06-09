import { Skeleton } from '@/components/ui/skeleton'

export function TicketDetailSkeleton() {
  return (
    <div data-testid="ticket-detail-skeleton" className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-2 mt-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-64" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg mt-6" />
    </div>
  )
}
