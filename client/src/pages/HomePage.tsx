import { authClient } from '../lib/auth-client'
import Navbar from '../components/Navbar'

export default function HomePage() {
  const { data: session } = authClient.useSession()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Welcome back, {session!.user.name}.</p>
      </main>
    </div>
  )
}
