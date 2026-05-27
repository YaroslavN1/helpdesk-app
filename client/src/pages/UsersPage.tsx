import { useEffect, useState } from 'react'
import { CreateUserDialog, type User } from '@/components/CreateUserDialog'
import { UsersTable } from '@/components/UsersTable'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <CreateUserDialog onCreated={(user) => setUsers((prev) => [...prev, user])} />
      </div>
      <UsersTable users={users} loading={loading} error={error} />
    </>
  )
}
