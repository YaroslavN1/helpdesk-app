import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateUserDialog, type User } from './CreateUserDialog'

const NEW_USER: User = {
  id: '3',
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'agent',
  createdAt: '2024-06-01T00:00:00.000Z',
}

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

function setup() {
  const onOpenChange = vi.fn()
  const onCreated = vi.fn()
  const user = userEvent.setup()
  render(
    <CreateUserDialog open={true} onOpenChange={onOpenChange} onCreated={onCreated} />,
  )
  return { user, onOpenChange, onCreated }
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  values: { name?: string; email?: string; password?: string } = {},
) {
  const { name = 'Jane Smith', email = 'jane@example.com', password = 'password123' } = values
  await user.type(screen.getByLabelText('Name'), name)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
}

describe('CreateUserDialog — form rendering', () => {
  it('renders name, email, and password fields', () => {
    setup()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders Cancel and submit buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
  })
})

describe('CreateUserDialog — validation', () => {
  it('shows all field errors when submitting an empty form', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument()
      expect(screen.getByText('Valid email is required')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('shows an error when name is too short', async () => {
    const { user } = setup()
    await fillForm(user, { name: 'ab' })
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument(),
    )
  })

  it('shows an error when email is invalid', async () => {
    const { user } = setup()
    await fillForm(user, { email: 'notanemail' })
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Valid email is required')).toBeInTheDocument(),
    )
  })

  it('shows an error when password is too short', async () => {
    const { user } = setup()
    await fillForm(user, { password: 'abc123' })
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument(),
    )
  })
})

describe('CreateUserDialog — submission', () => {
  it('POSTs to /api/users with the correct body', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(NEW_USER),
    })
    vi.stubGlobal('fetch', fetchSpy)
    const { user } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jane Smith', email: 'jane@example.com', password: 'password123' }),
      }),
    )
  })

  it('calls onCreated with the returned user on success', async () => {
    mockFetch(NEW_USER)
    const { user, onCreated } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(NEW_USER))
  })

  it('calls onOpenChange(false) to close after successful creation', async () => {
    mockFetch(NEW_USER)
    const { user, onOpenChange } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('shows the server error when the response contains an error field', async () => {
    mockFetch({ error: 'Email already in use' }, false)
    const { user } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Email already in use')).toBeInTheDocument(),
    )
  })

  it('shows a fallback error when the response has no error field', async () => {
    mockFetch({}, false)
    const { user } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Failed to create user')).toBeInTheDocument(),
    )
  })

  it('shows an error message on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error()))
    const { user } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Failed to create user')).toBeInTheDocument(),
    )
  })
})

describe('CreateUserDialog — loading state', () => {
  it('shows "Creating…" on the submit button and disables Cancel while submitting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const { user } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating…' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })
  })
})

describe('CreateUserDialog — Cancel', () => {
  it('calls onOpenChange(false) when Cancel is clicked', async () => {
    const { user, onOpenChange } = setup()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('CreateUserDialog — reset on reopen', () => {
  it('clears validation errors when the dialog is reopened', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <CreateUserDialog open={true} onOpenChange={onOpenChange} onCreated={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Create user' }))
    await waitFor(() =>
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument(),
    )

    rerender(<CreateUserDialog open={false} onOpenChange={onOpenChange} onCreated={vi.fn()} />)
    rerender(<CreateUserDialog open={true} onOpenChange={onOpenChange} onCreated={vi.fn()} />)

    await waitFor(() =>
      expect(screen.queryByText('Name must be at least 3 characters')).not.toBeInTheDocument(),
    )
  })
})
