import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TicketsTable } from './TicketsTable'
import { TicketStatus } from '@helpdesk/core'
import { TICKETS } from '@/test/fixtures'

function renderTicketsTable(overrides: Partial<React.ComponentProps<typeof TicketsTable>> = {}) {
  return render(
    <TicketsTable
      tickets={TICKETS}
      loading={false}
      error={null}
      sort={{ column: 'createdAt', order: 'desc' }}
      onSortChange={vi.fn()}
      {...overrides}
    />,
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('TicketsTable — loading state', () => {
  it('shows 4 skeleton rows while loading', () => {
    renderTicketsTable({ loading: true, tickets: [] })

    expect(document.querySelectorAll('tbody tr')).toHaveLength(4)
  })
})

describe('TicketsTable — error state', () => {
  it('shows the error message when error prop is set', () => {
    renderTicketsTable({ tickets: [], error: 'Failed to load tickets' })

    expect(screen.getByText('Failed to load tickets')).toBeInTheDocument()
  })
})

describe('TicketsTable — empty state', () => {
  it('shows "No tickets yet." when tickets array is empty', () => {
    renderTicketsTable({ tickets: [] })

    expect(screen.getByText('No tickets yet.')).toBeInTheDocument()
  })
})

describe('TicketsTable — loaded state', () => {
  it('renders column headers', () => {
    renderTicketsTable()

    expect(screen.getByText('Id')).toBeInTheDocument()
    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Assigned to')).toBeInTheDocument()
    expect(screen.getByText('Received')).toBeInTheDocument()
  })

  it('renders a row for each ticket', () => {
    renderTicketsTable()

    expect(document.querySelectorAll('tbody tr')).toHaveLength(TICKETS.length)
  })

  it('renders ticket id, subject, fromName, and fromEmail', () => {
    renderTicketsTable()

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('renders a status badge for each status value', () => {
    renderTicketsTable()

    // TICKETS variable has mock data for all 3 cases
    expect(screen.getByText(TicketStatus.open)).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.resolved)).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.closed)).toBeInTheDocument()
  })

  it('shows the formatted category label for non-null category', () => {
    renderTicketsTable()

    // technical_question → "Technical question"
    expect(screen.getByText('Technical question')).toBeInTheDocument()
    // refund_request → "Refund request"
    expect(screen.getByText('Refund request')).toBeInTheDocument()
  })

  it('shows "—" for a null category', () => {
    renderTicketsTable()

    // TICKETS[2] has category: null
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the assigned agent name when assignedTo is set', () => {
    renderTicketsTable()

    expect(screen.getByText('Bob Agent')).toBeInTheDocument()
  })

  it('shows "Unassigned" when assignedTo is null', () => {
    renderTicketsTable()

    // TICKETS[1] and TICKETS[2] both have assignedTo: null
    const unassigned = screen.getAllByText('Unassigned')
    expect(unassigned.length).toBeGreaterThanOrEqual(1)
  })

  it('formats the createdAt date correctly', () => {
    renderTicketsTable()

    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument()
  })
})

describe('TicketsTable — sorting', () => {
  it('shows ArrowDown icon on the default sort column (createdAt desc)', () => {
    renderTicketsTable()

    const receivedButton = screen.getByRole('button', { name: /received/i })
    expect(receivedButton.querySelector('.lucide-arrow-down')).toBeInTheDocument()
    expect(receivedButton.querySelector('.lucide-arrow-up')).not.toBeInTheDocument()
  })

  it('shows ArrowUp icon on the active column when order is asc', () => {
    renderTicketsTable({ sort: { column: 'subject', order: 'asc' } })

    const subjectButton = screen.getByRole('button', { name: /subject/i })
    expect(subjectButton.querySelector('.lucide-arrow-up')).toBeInTheDocument()
    expect(subjectButton.querySelector('.lucide-arrow-down')).not.toBeInTheDocument()
  })

  it('shows ArrowDown icon on the active column when order is desc', () => {
    renderTicketsTable({ sort: { column: 'subject', order: 'desc' } })

    const subjectButton = screen.getByRole('button', { name: /subject/i })
    expect(subjectButton.querySelector('.lucide-arrow-down')).toBeInTheDocument()
    expect(subjectButton.querySelector('.lucide-arrow-up')).not.toBeInTheDocument()
  })

  it('shows ArrowUpDown icon on an inactive sortable column', () => {
    renderTicketsTable({ sort: { column: 'subject', order: 'asc' } })

    const statusButton = screen.getByRole('button', { name: /status/i })
    expect(statusButton.querySelector('.lucide-arrow-up-down')).toBeInTheDocument()
  })

  it('calls onSortChange with { column: "subject", order: "asc" } when the Subject header is clicked', async () => {
    const onSortChange = vi.fn()
    renderTicketsTable({ onSortChange })

    await userEvent.click(screen.getByRole('button', { name: /subject/i }))

    expect(onSortChange).toHaveBeenCalledWith({ column: 'subject', order: 'asc' })
  })

  it('calls onSortChange with { column: "id", order: "asc" } when the # header is clicked', async () => {
    const onSortChange = vi.fn()
    renderTicketsTable({ onSortChange })

    await userEvent.click(screen.getByRole('button', { name: /^id$/i }))

    expect(onSortChange).toHaveBeenCalledWith({ column: 'id', order: 'asc' })
  })

  it('does not call onSortChange when sortable header buttons are disabled during loading', async () => {
    const onSortChange = vi.fn()
    renderTicketsTable({ loading: true, tickets: [], onSortChange })

    const buttons = screen.getAllByRole('button')
    expect(buttons.every((btn) => btn.hasAttribute('disabled'))).toBe(true)

    for (const btn of buttons) {
      await userEvent.click(btn)
    }

    expect(onSortChange).not.toHaveBeenCalled()
  })

  it('renders "Assigned to" as a plain header with no button', () => {
    renderTicketsTable()

    // All buttons in the header are sortable columns; none should be labelled "Assigned to"
    const buttons = screen.getAllByRole('button')
    const labels = buttons.map((btn) => btn.textContent ?? '')
    expect(labels.some((label) => label.includes('Assigned to'))).toBe(false)
    expect(screen.getByText('Assigned to')).toBeInTheDocument()
  })
})
