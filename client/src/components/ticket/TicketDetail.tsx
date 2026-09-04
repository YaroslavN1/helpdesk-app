interface TicketDetailProps {
  title: string
  data: string
}

export function TicketDetail({ title, data }: TicketDetailProps) {
  return (
    <div className="flex items-center gap-2 min-h-7">
      <dt className="w-24 shrink-0 text-muted-foreground">{title}</dt>
      <dd>{data}</dd>
    </div>
  )
}
