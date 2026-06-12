import { useEffect, useState } from 'react'
import { type SelectOption } from '@/components/ui/select'
import { TicketSelectField, type TicketUpdateResult } from '@/components/tickets/TicketSelectField'
import { TICKET_STATUS_BADGE, TICKET_CATEGORY_BADGE } from '@/components/tickets/ticket-badges'
import { type TicketDetails, type AgentOption, TICKET_STATUSES, TICKET_CATEGORIES, type TicketStatus, type TicketCategory } from '@helpdesk/core'

const STATUS_OPTIONS: SelectOption[] = TICKET_STATUSES.map((status) => ({
  value: status,
  label: TICKET_STATUS_BADGE[status].label,
}))

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: null, label: 'None' },
  ...TICKET_CATEGORIES.map((category) => ({
    value: category,
    label: TICKET_CATEGORY_BADGE[category].label,
  })),
]

function mapAgentOptions(agents: AgentOption[]): SelectOption[] {
  return [
    { value: null, label: 'Unassigned' },
    ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
  ]
}

interface TicketFieldsEditorProps {
  ticket: TicketDetails
  updateTicket: (body: Record<string, unknown>) => Promise<TicketUpdateResult>
}

export function TicketFieldsEditor({ ticket, updateTicket }: TicketFieldsEditorProps) {
  const [agentOptions, setAgentOptions] = useState<SelectOption[]>([])

  useEffect(() => {
    fetch('/api/users/agents', { credentials: 'include' })
      .then((response) => response.ok ? (response.json() as Promise<AgentOption[]>) : [])
      .then((agents) => setAgentOptions(mapAgentOptions(agents)))
  }, [])

  return (
    <>
      <TicketSelectField
        label="Status"
        value={ticket.status}
        options={STATUS_OPTIONS}
        updateTicket={updateTicket}
        mapSelected={(value) => value ? { status: value as TicketStatus } : null}
        className="h-7 w-36 text-sm"
        data-testid="status-select"
      />
      <TicketSelectField
        label="Category"
        value={ticket.category}
        options={CATEGORY_OPTIONS}
        updateTicket={updateTicket}
        mapSelected={(value) => ({ category: value as TicketCategory | null })}
        className="h-7 w-48 text-sm"
        data-testid="category-select"
      />
      <TicketSelectField
        label="Assigned to"
        value={ticket.assignedTo?.id ?? null}
        options={agentOptions}
        updateTicket={updateTicket}
        mapSelected={(value) => ({ assignedToId: value })}
        className="h-7 w-48 text-sm"
        data-testid="assign-to-select"
      />
    </>
  )
}
