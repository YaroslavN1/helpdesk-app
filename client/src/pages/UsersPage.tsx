import { useState } from 'react'
import { UserForm, type FormState } from '@/components/users/UserForm'
import { UsersTable } from '@/components/users/UsersTable'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useUsers, useDeleteUser } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/api-client'
import { type User } from '@/types/user'

export default function UsersPage() {
  const { data: users, isPending, error } = useUsers()
  const deleteUser = useDeleteUser()
  const [userFormState, setUserFormState] = useState<FormState | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  function updateUserToDelete(user: User | null) {
    deleteUser.reset()
    setUserToDelete(user)
  }

  function handleUserDelete() {
    if (!userToDelete) return
    deleteUser.mutate(userToDelete.id, {
      onSuccess: () => setUserToDelete(null),
    })
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
        users={users ?? []}
        loading={isPending}
        error={getErrorMessage(error, 'Failed to load users')}
        onEdit={(user) => setUserFormState({ mode: 'edit', user })}
        onDelete={updateUserToDelete}
      />
      <UserForm
        form={userFormState}
        onOpenChange={(open) => {
          if (!open) setUserFormState(null)
        }}
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
        error={getErrorMessage(deleteUser.error, 'Failed to delete user')}
        onConfirm={handleUserDelete}
        onOpenChange={(open) => {
          if (!open) updateUserToDelete(null)
        }}
      />
    </>
  )
}
