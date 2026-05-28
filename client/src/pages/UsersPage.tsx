import { useEffect, useState } from 'react'
import { UserForm, type User, type FormState } from '@/components/UserForm'
import { UsersTable } from '@/components/UsersTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)

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
      formState?.mode === 'edit'
        ? prev.map((user) => (user.id === savedUser.id ? savedUser : user))
        : [...prev, savedUser]
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <Button onClick={() => setFormState({ mode: 'create', user: null })}><Plus className="size-4" />New user</Button>
      </div>
      <UsersTable users={users} loading={loading} error={error} onEdit={(user) => setFormState({ mode: 'edit', user })} />
      <UserForm
        form={formState}
        onOpenChange={(open) => { if (!open) setFormState(null) }}
        onSaved={handleSaved}
      />
    </>
  )
}
