import { TicketSelectField } from '@/components/tickets/TicketSelectField'
import { type SelectOption } from '@/components/ui/select'
import { useAgents } from '@/hooks/useAgents'
import { useUpdateTicket } from '@/hooks/useTicket'
import { getErrorMessage } from '@/lib/api-client'
import {
  type TicketDetails,
  type AgentOption,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  type TicketStatus,
  type TicketCategory,
} from '@helpdesk/core'

const STATUS_OPTIONS: SelectOption[] = TICKET_STATUSES.map((status) => ({
  value: status,
  label: TICKET_STATUS_LABELS[status],
}))

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: null, label: '—' },
  ...TICKET_CATEGORIES.map((category) => ({
    value: category,
    label: TICKET_CATEGORY_LABELS[category],
  })),
]

function mapAgentOptions(agents: AgentOption[]): SelectOption[] {
  const defaultOption = { value: null, label: '—' }
  return [defaultOption, ...agents.map((agent) => ({ value: agent.id, label: agent.name }))]
}

interface TicketFieldsEditorProps {
  ticket: TicketDetails
}

export function TicketFieldsEditor({ ticket }: TicketFieldsEditorProps) {
  const { data: agents } = useAgents()
  const agentOptions = mapAgentOptions(agents ?? [])
  const ticketId = String(ticket.id)

  const updateStatus = useUpdateTicket(ticketId)
  const updateCategory = useUpdateTicket(ticketId)
  const updateAssignee = useUpdateTicket(ticketId)

  return (
    <>
      <TicketSelectField
        label="Status"
        value={ticket.status}
        options={STATUS_OPTIONS}
        onValueChange={(value) => updateStatus.mutate({ status: value as TicketStatus })}
        disabled={updateStatus.isPending}
        error={getErrorMessage(updateStatus.error, 'Failed to update ticket')}
        className="h-7 w-36 text-sm"
        data-testid="status-select"
      />
      <TicketSelectField
        label="Category"
        value={ticket.category}
        options={CATEGORY_OPTIONS}
        onValueChange={(value) =>
          updateCategory.mutate({ category: value as TicketCategory | null })
        }
        disabled={updateCategory.isPending}
        error={getErrorMessage(updateCategory.error, 'Failed to update ticket')}
        className="h-7 w-48 text-sm"
        data-testid="category-select"
      />
      <TicketSelectField
        label="Assigned to"
        value={ticket.assignedTo?.id ?? null}
        options={agentOptions}
        onValueChange={(value) => updateAssignee.mutate({ assignedToId: value })}
        disabled={updateAssignee.isPending}
        error={getErrorMessage(updateAssignee.error, 'Failed to update ticket')}
        className="h-7 w-48 text-sm"
        data-testid="assign-to-select"
      />
    </>
  )
}
