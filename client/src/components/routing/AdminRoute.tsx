import { Navigate, Outlet } from 'react-router'
import { authClient } from '@/lib/auth-client'
import { UserRole } from '@helpdesk/core'
import LoadingScreen from '@/components/layout/LoadingScreen'

export default function AdminRoute() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <LoadingScreen />
  }

  if (session?.user.role !== UserRole.admin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
