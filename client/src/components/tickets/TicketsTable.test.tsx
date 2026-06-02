import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TicketsTable } from './TicketsTable'
import { TicketStatus } from '@helpdesk/core'
import { TICKETS } from '@/test/fixtures'

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('TicketsTable — loading state', () => {
  it('shows 4 skeleton rows while loading', () => {
    render(<TicketsTable tickets={[]} loading={true} error={null} />)

    expect(document.querySelectorAll('tbody tr')).toHaveLength(4)
  })
})

describe('TicketsTable — error state', () => {
  it('shows the error message and no table rows when error prop is set', () => {
    render(<TicketsTable tickets={[]} loading={false} error="Failed to load tickets" />)

    expect(screen.getByText('Failed to load tickets')).toBeInTheDocument()
    expect(document.querySelectorAll('tbody tr')).toHaveLength(0)
  })
})

describe('TicketsTable — empty state', () => {
  it('shows "No tickets yet." when tickets array is empty', () => {
    render(<TicketsTable tickets={[]} loading={false} error={null} />)

    expect(screen.getByText('No tickets yet.')).toBeInTheDocument()
  })
})

describe('TicketsTable — loaded state', () => {
  it('renders column headers', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    expect(screen.getByText('#')).toBeInTheDocument()
    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Assigned to')).toBeInTheDocument()
    expect(screen.getByText('Received')).toBeInTheDocument()
  })

  it('renders a row for each ticket', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    expect(document.querySelectorAll('tbody tr')).toHaveLength(TICKETS.length)
  })

  it('renders ticket id, subject, fromName, and fromEmail', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('renders a status badge for each status value', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    // TICKETS variable has mock data for all 3 cases
    expect(screen.getByText(TicketStatus.open)).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.resolved)).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.closed)).toBeInTheDocument()
  })

  it('shows the formatted category label for non-null category', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    // technical_question → "Technical question"
    expect(screen.getByText('Technical question')).toBeInTheDocument()
    // refund_request → "Refund request"
    expect(screen.getByText('Refund request')).toBeInTheDocument()
  })

  it('shows "—" for a null category', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    // TICKETS[2] has category: null
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the assigned agent name when assignedTo is set', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    expect(screen.getByText('Bob Agent')).toBeInTheDocument()
  })

  it('shows "Unassigned" when assignedTo is null', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    // TICKETS[1] and TICKETS[2] both have assignedTo: null
    const unassigned = screen.getAllByText('Unassigned')
    expect(unassigned.length).toBeGreaterThanOrEqual(1)
  })

  it('formats the createdAt date correctly', () => {
    render(<TicketsTable tickets={TICKETS} loading={false} error={null} />)

    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument()
  })
})
