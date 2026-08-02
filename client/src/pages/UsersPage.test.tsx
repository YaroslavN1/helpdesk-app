import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { renderWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved, mockRejected, mockPending } from '@/test-utils/mock-helpers'
import { USERS, NEW_USER } from '@/test-utils/fixtures'
import UsersPage from './UsersPage'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

async function renderUsersPage() {
  mockResolved(apiClient.get, { data: USERS })
  const user = userEvent.setup()
  renderWithQueryClient(<UsersPage />)
  await waitFor(() => expect(screen.getByText(USERS[0].name)).toBeInTheDocument())
  return user
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UsersPage', () => {
  describe('loading state', () => {
    it('calls /users', () => {
      mockPending(apiClient.get)
      renderWithQueryClient(<UsersPage />)

      expect(apiClient.get).toHaveBeenCalledWith('/users')
    })

    it('shows skeleton rows while loading', () => {
      mockPending(apiClient.get)
      renderWithQueryClient(<UsersPage />)

      expect(document.querySelectorAll('tbody tr')).toHaveLength(4)
    })
  })

  describe('error state', () => {
    it('shows the server error message when the response contains an error field', async () => {
      mockRejected(apiClient.get, {
        isAxiosError: true,
        response: { status: 500, data: { error: 'Something went wrong' } },
      })
      renderWithQueryClient(<UsersPage />)

      await waitFor(() => expect(screen.getByText('Something went wrong')).toBeInTheDocument())
    })

    it('shows a fallback error message when fetch rejects with no server message', async () => {
      mockRejected(apiClient.get, { isAxiosError: true, response: undefined })
      renderWithQueryClient(<UsersPage />)

      await waitFor(() => expect(screen.getByText('Failed to load users')).toBeInTheDocument())
    })
  })

  describe('loaded state', () => {
    it('hides skeletons after loading completes', async () => {
      mockResolved(apiClient.get, { data: USERS })
      renderWithQueryClient(<UsersPage />)

      await waitFor(() => expect(screen.getByText('Admin Test User')).toBeInTheDocument())

      expect(screen.getAllByRole('row').filter((row) => row.closest('tbody'))).toHaveLength(2)
    })

    it('renders the page heading', () => {
      mockPending(apiClient.get)
      renderWithQueryClient(<UsersPage />)
      expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
    })

    it('renders all five column headers', async () => {
      mockResolved(apiClient.get, { data: USERS })
      renderWithQueryClient(<UsersPage />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
      expect(screen.getByText('Joined')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('renders a row for each user', async () => {
      mockResolved(apiClient.get, { data: USERS })
      renderWithQueryClient(<UsersPage />)

      await waitFor(() => expect(document.querySelectorAll('tbody tr')).toHaveLength(USERS.length))
    })

    it('renders user name and email', async () => {
      mockResolved(apiClient.get, { data: USERS })
      renderWithQueryClient(<UsersPage />)

      await waitFor(() => expect(screen.getByText('Admin Test User')).toBeInTheDocument())
      expect(screen.getByText('admin_test@example.com')).toBeInTheDocument()
    })

    it('renders role badges for each user', async () => {
      mockResolved(apiClient.get, { data: USERS })
      renderWithQueryClient(<UsersPage />)

      await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())
      expect(screen.getByText('agent')).toBeInTheDocument()
    })

    it('formats the joined date correctly', async () => {
      mockResolved(apiClient.get, { data: USERS })
      renderWithQueryClient(<UsersPage />)

      await waitFor(() => expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument())
    })
  })

  describe('create user', () => {
    it('shows the dialog when the "New user" button is clicked', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getByRole('button', { name: /new user/i }))

      expect(screen.getByRole('heading', { name: 'Create user' })).toBeInTheDocument()
    })

    it('hides the dialog when Escape is pressed', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getByRole('button', { name: /new user/i }))
      expect(screen.getByRole('heading', { name: 'Create user' })).toBeInTheDocument()

      await user.keyboard('{Escape}')

      await waitFor(() =>
        expect(screen.queryByRole('heading', { name: 'Create user' })).not.toBeInTheDocument(),
      )
    })

    it('hides the dialog when clicking outside', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getByRole('button', { name: /new user/i }))
      expect(screen.getByRole('heading', { name: 'Create user' })).toBeInTheDocument()

      await user.click(document.querySelector('[data-slot="dialog-overlay"]')!)

      await waitFor(() =>
        expect(screen.queryByRole('heading', { name: 'Create user' })).not.toBeInTheDocument(),
      )
    })

    it('appends the new user to the table after successful creation', async () => {
      const user = await renderUsersPage()

      mockResolved(apiClient.post, { data: NEW_USER })

      await user.click(screen.getByRole('button', { name: /new user/i }))
      await user.type(screen.getByLabelText('Name'), NEW_USER.name)
      await user.type(screen.getByLabelText('Email'), NEW_USER.email)
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Create user' }))

      await waitFor(() => expect(screen.getByText(NEW_USER.name)).toBeInTheDocument())
      // The new user is written directly into the query cache from the mutation
      // response — no refetch of /users happens.
      expect(apiClient.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('edit user', () => {
    it('shows the "Edit user" dialog when an edit button is clicked', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])

      expect(screen.getByRole('heading', { name: 'Edit user' })).toBeInTheDocument()
    })

    it('pre-populates name and email from the selected user', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])

      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toHaveValue(USERS[0].name)
        expect(screen.getByLabelText('Email')).toHaveValue(USERS[0].email)
      })
    })

    it('shows the password hint in edit mode', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])

      expect(screen.getByText('(leave blank to keep current)')).toBeInTheDocument()
    })

    it('opens with the correct user when a different row edit button is clicked', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getAllByRole('button', { name: 'Edit user' })[1])

      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toHaveValue(USERS[1].name)
        expect(screen.getByLabelText('Email')).toHaveValue(USERS[1].email)
      })
    })

    it('updates the user row in the table after a successful edit', async () => {
      const UPDATED_USER = { ...USERS[0], name: 'Updated Name' }
      const user = await renderUsersPage()

      await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])
      await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue(USERS[0].name))

      mockResolved(apiClient.patch, { data: UPDATED_USER })

      await user.clear(screen.getByLabelText('Name'))
      await user.type(screen.getByLabelText('Name'), 'Updated Name')
      await user.click(screen.getByRole('button', { name: 'Save changes' }))

      await waitFor(() => expect(screen.getByText('Updated Name')).toBeInTheDocument())
      expect(screen.queryByText(USERS[0].name)).not.toBeInTheDocument()
      // The updated user is written directly into the query cache from the mutation
      // response — no refetch of /users happens.
      expect(apiClient.get).toHaveBeenCalledTimes(1)
    })

    it('resets to an empty form when "New user" is opened after closing an edit dialog', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0])
      await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue(USERS[0].name))

      await user.keyboard('{Escape}')
      await waitFor(() =>
        expect(screen.queryByRole('heading', { name: 'Edit user' })).not.toBeInTheDocument(),
      )

      await user.click(screen.getByRole('button', { name: /new user/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toHaveValue('')
        expect(screen.getByLabelText('Email')).toHaveValue('')
      })
    })
  })

  describe('delete user', () => {
    it('hides the delete button for admin users and shows it for agents', async () => {
      await renderUsersPage()

      const deleteButtons = screen.getAllByRole('button', {
        name: 'Delete user',
      })
      expect(deleteButtons).toHaveLength(1)
    })

    it('opens the confirmation dialog when the delete button is clicked', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getByRole('button', { name: 'Delete user' }))

      expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()
    })

    it('shows the user name in the dialog description', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getByRole('button', { name: 'Delete user' }))

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog')
        expect(dialog).toHaveTextContent(USERS[1].name)
      })
    })

    it('closes the dialog and makes no DELETE call when Cancel is clicked', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getByRole('button', { name: 'Delete user' }))
      expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() =>
        expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument(),
      )
      expect(apiClient.delete).not.toHaveBeenCalled()
    })

    it('removes the user row and closes the dialog after a successful deletion', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getByRole('button', { name: 'Delete user' }))
      expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()

      mockResolved(apiClient.delete, { data: null })

      await user.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith(`/users/${USERS[1].id}`)
        expect(screen.queryByText(USERS[1].name)).not.toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument()
      })
      // The deleted user is removed directly from the query cache using the
      // mutation's own variables — no refetch of /users happens.
      expect(apiClient.get).toHaveBeenCalledTimes(1)
    })

    it('shows the error message in the dialog and keeps the dialog open on API failure', async () => {
      const user = await renderUsersPage()

      await user.click(screen.getByRole('button', { name: 'Delete user' }))
      expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()

      mockRejected(apiClient.delete, {
        isAxiosError: true,
        response: { data: { error: 'Something went wrong' } },
      })

      await user.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()
      })
    })
  })
})
