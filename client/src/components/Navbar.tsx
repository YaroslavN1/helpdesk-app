import { useNavigate } from 'react-router'
import { authClient } from '../lib/auth-client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function Navbar() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <span className="font-semibold">Helpdesk</span>

        <div className="flex items-center gap-3">
          {session && (
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
      <Separator />
    </header>
  )
}
