import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TicketsTable } from './TicketsTable'
import { TicketStatus } from '@helpdesk/core'
import { TICKETS } from '@/test/fixtures'
import { log } from 'console'

const DEFAULT_SORT_PROPS = {
  onSortChange: vi.fn(),
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('TicketsTable — loading state', () => {
  it('shows 4 skeleton rows while loading', () => {
    render(<TicketsTable tickets={[]} loading={true} error={null} {...DEFAULT_SORT_PROPS} />)

    expect(document.querySelectorAll('tbody tr')).toHaveLength(4)
  })
})

describe('TicketsTable — error state', () => {
  it('shows the error message when error prop is set', () => {
    render(<TicketsTable tickets={[]} loading={false} error="Failed to load tickets" {...DEFAULT_SORT_PROPS} />)

    expect(screen.getByText('Failed to load tickets')).toBeInTheDocument()
  })
})

describe('TicketsTable — empty state', () => {
  it('shows "No tickets yet." when tickets array is empty', () => {
    render(<TicketsTable tickets={[]} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    expect(screen.getByText('No tickets yet.')).toBeInTheDocument()
  })
})

describe('TicketsTable — loaded state', () => {
  it('renders column headers', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    expect(screen.getByText('#')).toBeInTheDocument()
    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Assigned to')).toBeInTheDocument()
    expect(screen.getByText('Received')).toBeInTheDocument()
  })

  it('renders a row for each ticket', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    expect(document.querySelectorAll('tbody tr')).toHaveLength(TICKETS.length)
  })

  it('renders ticket id, subject, fromName, and fromEmail', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('renders a status badge for each status value', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    // TICKETS variable has mock data for all 3 cases
    expect(screen.getByText(TicketStatus.open)).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.resolved)).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.closed)).toBeInTheDocument()
  })

  it('shows the formatted category label for non-null category', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    // technical_question → "Technical question"
    expect(screen.getByText('Technical question')).toBeInTheDocument()
    // refund_request → "Refund request"
    expect(screen.getByText('Refund request')).toBeInTheDocument()
  })

  it('shows "—" for a null category', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    // TICKETS[2] has category: null
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the assigned agent name when assignedTo is set', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    expect(screen.getByText('Bob Agent')).toBeInTheDocument()
  })

  it('shows "Unassigned" when assignedTo is null', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    // TICKETS[1] and TICKETS[2] both have assignedTo: null
    const unassigned = screen.getAllByText('Unassigned')
    expect(unassigned.length).toBeGreaterThanOrEqual(1)
  })

  it('formats the createdAt date correctly', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} {...DEFAULT_SORT_PROPS} />)

    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument()
  })
})

describe('TicketsTable — sorting', () => {
  it('shows ArrowDown icon on a default sorting column (createdAt -> desc)', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} onSortChange={vi.fn()} />)

    const receivedButton = screen.getByRole('button', { name: /received/i })
    expect(receivedButton.querySelector('.lucide-arrow-down')).toBeInTheDocument()
    expect(receivedButton.querySelector('.lucide-arrow-up')).not.toBeInTheDocument()
  })

  it('shows ArrowUp icon on a new column after clicking it once (asc)', async () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} onSortChange={vi.fn()} />)

    const subjectButton = screen.getByRole('button', { name: /subject/i })
    await userEvent.click(subjectButton)

    expect(subjectButton.querySelector('.lucide-arrow-up')).toBeInTheDocument()
    expect(subjectButton.querySelector('.lucide-arrow-down')).not.toBeInTheDocument()
  })

  it('shows ArrowDown icon on a new column after clicking it twice (asc -> desc)', async () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} onSortChange={vi.fn()} />)

    const subjectButton = screen.getByRole('button', { name: /subject/i })
    await userEvent.click(subjectButton)
    await userEvent.click(subjectButton)

    expect(subjectButton.querySelector('.lucide-arrow-down')).toBeInTheDocument()
    expect(subjectButton.querySelector('.lucide-arrow-up')).not.toBeInTheDocument()
  })

  it('shows ArrowUpDown icon on inactive sortable column', async () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} onSortChange={vi.fn()} />)

    const subjectButton = screen.getByRole('button', { name: /subject/i })
    await userEvent.click(subjectButton)
    const statusButton = screen.getByRole('button', { name: /status/i })
    
    expect(statusButton.querySelector('.lucide-arrow-up-down')).toBeInTheDocument()
  })

  it('calls onSortChange with ("subject", "asc") when the Subject header is clicked', async () => {
    const onSortChange = vi.fn()
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} onSortChange={onSortChange} />)

    await userEvent.click(screen.getByRole('button', { name: /subject/i }))

    expect(onSortChange).toHaveBeenCalledWith({ column: 'subject', order: 'asc' })
  })

  it('calls onSortChange with ("id", "asc") when the # header is clicked', async () => {
    const onSortChange = vi.fn()
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} onSortChange={onSortChange} />)

    await userEvent.click(screen.getByRole('button', { name: /#/i }))

    expect(onSortChange).toHaveBeenCalledWith({ column: 'id', order: 'asc' })
  })

  it('does not call onSortChange when sortable header buttons are disabled during loading', async () => {
    const onSortChange = vi.fn()
    render(<TicketsTable tickets={[]} loading={true} error={null} onSortChange={onSortChange} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.every((btn) => btn.hasAttribute('disabled'))).toBe(true)

    for (const btn of buttons) {
      await userEvent.click(btn)
    }

    expect(onSortChange).not.toHaveBeenCalled()
  })

  it('renders "Assigned to" as a plain header with no button', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} onSortChange={vi.fn()} />)

    // All buttons in the header are sortable columns; none should be labelled "Assigned to"
    const buttons = screen.getAllByRole('button')
    const labels = buttons.map((btn) => btn.textContent ?? '')
    expect(labels.some((label) => label.includes('Assigned to'))).toBe(false)
    expect(screen.getByText('Assigned to')).toBeInTheDocument()
  })
})
