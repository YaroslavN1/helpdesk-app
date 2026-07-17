import { useEffect, useState } from 'react'
import { UserForm, type User, type FormState } from '@/components/users/UserForm'
import { UsersTable } from '@/components/users/UsersTable'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userFormState, setUserFormState] = useState<FormState | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load users')
        return res.json() as Promise<User[]>
      })
      .then(setUsers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(savedUser: User) {
    setUsers((prev) =>
      userFormState?.mode === 'edit'
        ? prev.map((user) => (user.id === savedUser.id ? savedUser : user))
        : [...prev, savedUser],
    )
  }

  async function handleDeleteConfirm() {
    if (!userToDelete) return
    setDeleteError(null)

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setDeleteError(json.error ?? 'Failed to delete user')
        return
      }

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setUserToDelete(null)
    } catch {
      setDeleteError('Failed to delete user')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <Button onClick={() => setUserFormState({ mode: 'create', user: null })}>
          <Plus className="size-4" />
          New user
        </Button>
      </div>
      <UsersTable
        users={users}
        loading={loading}
        error={error}
        onEdit={(user) => setUserFormState({ mode: 'edit', user })}
        onDelete={(user) => {
          setDeleteError(null)
          setUserToDelete(user)
        }}
      />
      <UserForm
        form={userFormState}
        onOpenChange={(open) => {
          if (!open) setUserFormState(null)
        }}
        onSaved={handleSaved}
      />
      <ConfirmationDialog
        open={userToDelete !== null}
        title="Delete user"
        description={
          <>
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action
            cannot be undone.
          </>
        }
        confirmLabel="Delete"
        error={deleteError}
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteError(null)
            setUserToDelete(null)
          }
        }}
      />
    </>
  )
}
