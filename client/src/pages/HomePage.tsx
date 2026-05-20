import { authClient } from '../lib/auth-client'

export default function HomePage() {
  const { data: session } = authClient.useSession()

  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground mt-1">Welcome back, {session!.user.name}.</p>
    </>
  )
}
