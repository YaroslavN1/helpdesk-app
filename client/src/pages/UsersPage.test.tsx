import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import UsersPage from './UsersPage'

const USERS = [
  { id: '1', name: 'Admin Test User', email: 'admin_test@example.com', role: 'admin' as const, createdAt: '2024-01-15T00:00:00.000Z' },
  { id: '2', name: 'Agent Test User', email: 'agent_test@example.com', role: 'agent' as const, createdAt: '2024-03-22T00:00:00.000Z' },
]

function mockFetch(payload: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(payload),
    }),
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('UsersPage', () => {
  it('renders the page heading', () => {
    render(<UsersPage />)
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
  })

  it('shows skeleton rows while loading', () => {
    // fetch never resolves so the component stays in loading state
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<UsersPage />)

    expect(document.querySelectorAll('tbody tr')).toHaveLength(4)
  })

  it('hides skeletons after loading completes', async () => {
    mockFetch(USERS)
    render(<UsersPage />)

    await waitFor(() => expect(screen.getByText('Admin Test User')).toBeInTheDocument())

    // only the real data table rows should be present (2 users)
    expect(screen.getAllByRole('row').filter((r) => r.closest('tbody'))).toHaveLength(2)
  })

  it('renders table column headers', async () => {
    mockFetch(USERS)
    render(<UsersPage />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Joined')).toBeInTheDocument()
  })

  it('renders a row for each user', async () => {
    mockFetch(USERS)
    render(<UsersPage />)

    await waitFor(() =>
      expect(document.querySelectorAll('tbody tr')).toHaveLength(USERS.length),
    )
  })

  it('renders user name and email', async () => {
    mockFetch(USERS)
    render(<UsersPage />)

    await waitFor(() => expect(screen.getByText('Admin Test User')).toBeInTheDocument())
    expect(screen.getByText('admin_test@example.com')).toBeInTheDocument()
  })

  it('renders role badges for each user', async () => {
    mockFetch(USERS)
    render(<UsersPage />)

    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())
    expect(screen.getByText('agent')).toBeInTheDocument()
  })

  it('formats the joined date correctly', async () => {
    mockFetch(USERS)
    render(<UsersPage />)

    await waitFor(() => expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument())
  })

  it('calls /api/users with credentials include', () => {
    const fetchSpy = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', fetchSpy)
    render(<UsersPage />)

    expect(fetchSpy).toHaveBeenCalledWith('/api/users', { credentials: 'include' })
  })

  it('shows an error message when the fetch fails', async () => {
    mockFetch(null, false)
    render(<UsersPage />)

    await waitFor(() =>
      expect(screen.getByText('Failed to load users')).toBeInTheDocument(),
    )
  })

  it('shows an error message when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    render(<UsersPage />)

    await waitFor(() =>
      expect(screen.getByText('Network error')).toBeInTheDocument(),
    )
  })
})
