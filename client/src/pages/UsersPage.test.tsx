import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('UserForm — create user', () => {
  function setup() {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const user = userEvent.setup()
    render(<UsersPage />)
    return user
  }

  it('shows the dialog when the "New user" button is clicked', async () => {
    const user = setup()

    await user.click(screen.getByRole('button', { name: /new user/i }))

    expect(screen.getByRole('heading', { name: 'Create user' })).toBeInTheDocument()
  })

  it('hides the dialog when Escape is pressed', async () => {
    const user = setup()

    await user.click(screen.getByRole('button', { name: /new user/i }))
    expect(screen.getByRole('heading', { name: 'Create user' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Create user' })).not.toBeInTheDocument(),
    )
  })

  it('hides the dialog when clicking outside', async () => {
    const user = setup()

    await user.click(screen.getByRole('button', { name: /new user/i }))
    expect(screen.getByRole('heading', { name: 'Create user' })).toBeInTheDocument()

    await user.click(document.querySelector('[data-slot="dialog-overlay"]')!)

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Create user' })).not.toBeInTheDocument(),
    )
  })

  it('appends the new user to the table after successful creation', async () => {
    const NEW_USER = { id: '3', name: 'New Person', email: 'new@example.com', role: 'agent' as const, createdAt: '2024-06-01T00:00:00.000Z' }
    mockFetch(USERS)
    const user = userEvent.setup()
    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText(USERS[0].name)).toBeInTheDocument())

    mockFetch(NEW_USER)
    await user.click(screen.getByRole('button', { name: /new user/i }))
    await user.type(screen.getByLabelText('Name'), NEW_USER.name)
    await user.type(screen.getByLabelText('Email'), NEW_USER.email)
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => expect(screen.getByText(NEW_USER.name)).toBeInTheDocument())
  })
})

describe('UserForm — Edit user', () => {
  async function setup() {
    mockFetch(USERS)
    const user = userEvent.setup()
    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText(USERS[0].name)).toBeInTheDocument())
    return user
  }

  it('shows the "Edit user" dialog when an edit button is clicked', async () => {
    const user = await setup()

    await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])

    expect(screen.getByRole('heading', { name: 'Edit user' })).toBeInTheDocument()
  })

  it('pre-populates name and email from the selected user', async () => {
    const user = await setup()

    await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue(USERS[0].name)
      expect(screen.getByLabelText('Email')).toHaveValue(USERS[0].email)
    })
  })

  it('shows the password hint in edit mode', async () => {
    const user = await setup()

    await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])

    expect(screen.getByText('(leave blank to keep current)')).toBeInTheDocument()
  })

  it('opens with the correct user when a different row edit button is clicked', async () => {
    const user = await setup()

    await user.click(screen.getAllByRole('button', { name: 'Edit user' })[1])

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue(USERS[1].name)
      expect(screen.getByLabelText('Email')).toHaveValue(USERS[1].email)
    })
  })

  it('updates the user row in the table after a successful edit', async () => {
    const UPDATED = { ...USERS[0], name: 'Updated Name' }
    const user = await setup()

    mockFetch(UPDATED)
    await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue(USERS[0].name))

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Updated Name')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.getByText('Updated Name')).toBeInTheDocument())
    expect(screen.queryByText(USERS[0].name)).not.toBeInTheDocument()
  })

  it('resets to an empty form when "New user" is opened after closing an edit dialog', async () => {
    const user = await setup()

    await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue(USERS[0].name))

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Edit user' })).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /new user/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('')
      expect(screen.getByLabelText('Email')).toHaveValue('')
    })
  })
})

describe('UserForm - Delete user', () => {
  async function setup() {
    mockFetch(USERS)
    const user = userEvent.setup()
    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText(USERS[0].name)).toBeInTheDocument())
    return user
  }

  it('hides the delete button for admin users and shows it for agents', async () => {
    await setup()

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete user' })
    expect(deleteButtons).toHaveLength(1)
  })

  it('opens the confirmation dialog when the delete button is clicked', async () => {
    const user = await setup()

    await user.click(screen.getByRole('button', { name: 'Delete user' }))

    expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()
  })

  it('shows the user name in the dialog description', async () => {
    const user = await setup()

    await user.click(screen.getByRole('button', { name: 'Delete user' }))

    await waitFor(() => {
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveTextContent(USERS[1].name)
    })
  })

  it('closes the dialog and makes no DELETE fetch call when Cancel is clicked', async () => {
    const user = await setup()

    await user.click(screen.getByRole('button', { name: 'Delete user' }))
    expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()

    const fetchSpy = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', fetchSpy)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument(),
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('removes the user row and closes the dialog after a successful deletion', async () => {
    const user = await setup()

    await user.click(screen.getByRole('button', { name: 'Delete user' }))
    expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(null) }))

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.queryByText(USERS[1].name)).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument()
    })
  })

  it('shows the error message in the dialog and keeps the dialog open on API failure', async () => {
    const user = await setup()

    await user.click(screen.getByRole('button', { name: 'Delete user' }))
    expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Something went wrong' }),
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()
    })
  })
})
