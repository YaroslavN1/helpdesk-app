import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { renderWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved, mockRejected, mockPending } from '@/test-utils/mock-helpers'
import { NEW_USER } from '@/test-utils/fixtures'
import { UserForm } from './UserForm'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

beforeEach(() => {
  vi.clearAllMocks()
})

const DEFAULT_USER_FORM_VALUES = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  password: 'password123',
}

function renderUserForm() {
  const onOpenChange = vi.fn()
  const user = userEvent.setup()
  const { rerender } = renderWithQueryClient(
    <UserForm form={{ mode: 'create', user: null }} onOpenChange={onOpenChange} />,
  )
  return { user, onOpenChange, rerender }
}

async function fillUserForm(
  user: ReturnType<typeof userEvent.setup>,
  {
    name = DEFAULT_USER_FORM_VALUES.name,
    email = DEFAULT_USER_FORM_VALUES.email,
    password = DEFAULT_USER_FORM_VALUES.password,
  }: { name?: string; email?: string; password?: string } = {},
) {
  await user.type(screen.getByLabelText('Name'), name)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
}

describe('UserForm', () => {
  describe('form rendering', () => {
    it('renders name, email, and password fields', () => {
      renderUserForm()
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('renders Cancel and submit buttons', () => {
      renderUserForm()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows all field errors when submitting an empty form', async () => {
      const { user } = renderUserForm()

      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument()
        expect(screen.getByText('Valid email is required')).toBeInTheDocument()
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })
    })

    it('shows an error when name is too short', async () => {
      const { user } = renderUserForm()
      await fillUserForm(user, { name: 'ab' })
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() =>
        expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument(),
      )
    })

    it('shows an error when email is invalid', async () => {
      const { user } = renderUserForm()
      await fillUserForm(user, { email: 'notanemail' })
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() => expect(screen.getByText('Valid email is required')).toBeInTheDocument())
    })

    it('shows an error when password is too short', async () => {
      const { user } = renderUserForm()
      await fillUserForm(user, { password: 'abc123' })
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() =>
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument(),
      )
    })
  })

  describe('submission', () => {
    it('POSTs to /users with the correct body', async () => {
      mockResolved(apiClient.post, { data: NEW_USER })
      const { user } = renderUserForm()
      await fillUserForm(user)
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() =>
        expect(apiClient.post).toHaveBeenCalledWith('/users', DEFAULT_USER_FORM_VALUES),
      )
    })

    it('calls onOpenChange(false) to close after successful creation', async () => {
      mockResolved(apiClient.post, { data: NEW_USER })
      const { user, onOpenChange } = renderUserForm()
      await fillUserForm(user)
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it('shows the server error when the response contains an error field', async () => {
      mockRejected(apiClient.post, {
        isAxiosError: true,
        response: { data: { error: 'Email already in use' } },
      })
      const { user } = renderUserForm()
      await fillUserForm(user)
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() => expect(screen.getByText('Email already in use')).toBeInTheDocument())
    })

    it('shows a fallback error when the response has no error field', async () => {
      mockRejected(apiClient.post, {
        isAxiosError: true,
        response: { data: {} },
      })
      const { user } = renderUserForm()
      await fillUserForm(user)
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() => expect(screen.getByText('Failed to create user')).toBeInTheDocument())
    })

    it('shows an error message on network failure', async () => {
      mockRejected(apiClient.post, { isAxiosError: true, response: undefined })
      const { user } = renderUserForm()
      await fillUserForm(user)
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() => expect(screen.getByText('Failed to create user')).toBeInTheDocument())
    })
  })

  describe('loading state', () => {
    it('shows "Creating…" on the submit button and disables Cancel while submitting', async () => {
      mockPending(apiClient.post)
      const { user } = renderUserForm()
      await fillUserForm(user)
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Creating…' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      })
    })
  })

  describe('Cancel', () => {
    it('calls onOpenChange(false) when Cancel is clicked', async () => {
      const { user, onOpenChange } = renderUserForm()
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('reset on reopen', () => {
    it('clears validation errors when the dialog is reopened', async () => {
      const { user, onOpenChange, rerender } = renderUserForm()

      await user.click(screen.getByRole('button', { name: 'Create user' }))
      await waitFor(() =>
        expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument(),
      )

      rerender(<UserForm form={null} onOpenChange={onOpenChange} />)
      rerender(<UserForm form={{ mode: 'create', user: null }} onOpenChange={onOpenChange} />)

      await waitFor(() =>
        expect(screen.queryByText('Name must be at least 3 characters')).not.toBeInTheDocument(),
      )
    })
  })
})
