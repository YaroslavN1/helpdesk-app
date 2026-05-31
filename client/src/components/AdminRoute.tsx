import { Navigate, Outlet } from 'react-router'
import { authClient } from '@/lib/auth-client'
import { UserRole } from '@helpdesk/core'

export default function AdminRoute() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (session?.user.role !== UserRole.admin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
