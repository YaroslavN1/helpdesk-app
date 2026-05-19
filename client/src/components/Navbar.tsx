import { useNavigate } from 'react-router'
import { authClient } from '../lib/auth-client'

export default function Navbar() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <span className="font-semibold text-gray-900">Helpdesk</span>

        <div className="flex items-center gap-4">
          {session && (
            <span className="text-sm text-gray-600">{session.user.name}</span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
