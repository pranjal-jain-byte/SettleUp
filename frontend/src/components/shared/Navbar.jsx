import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4">
      <Link to={user ? ROUTES.DASHBOARD : ROUTES.HOME} className="font-display text-xl font-bold tracking-tight text-white">
        settle<span className="text-accent-green">up</span>
      </Link>
      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="text-[#6b7280] hidden sm:block">{user.username}</span>
            <button onClick={logout} className="text-[#6b7280] hover:text-white transition-colors">
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to={ROUTES.LOGIN} className="text-[#6b7280] hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="px-4 py-1.5 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] transition-colors text-white"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
