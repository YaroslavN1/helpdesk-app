import { Navigate, Outlet } from 'react-router'
import { authClient } from '@/lib/auth-client'
import LoadingScreen from '@/components/layout/LoadingScreen'

export default function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <LoadingScreen />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
