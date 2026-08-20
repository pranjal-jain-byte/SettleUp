import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import AuthLayout from '../layouts/AuthLayout'
import GlassCard from '../components/shared/GlassCard'
import GlassInput from '../components/shared/GlassInput'
import PasswordInput from '../components/shared/PasswordInput'
import GlassButton from '../components/shared/GlassButton'
import { cn } from '../lib/cn'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      await register(username, email, password)
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register')
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <GlassCard className="max-w-sm w-full p-8 flex flex-col items-start">
        <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center mb-4">
          <UserPlus className="text-white" size={20} />
        </div>

        <h1 className="font-display text-xl font-bold tracking-tight text-white mb-1 text-left">
          Create account
        </h1>
        <p className="text-white/50 text-sm mb-5 text-left">
          Join SettleUp today
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <GlassInput
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            minLength={3}
          />
          <GlassInput
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <PasswordInput
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={8}
          />
          
          {/* Strength indicator */}
          {password && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    password.length < 8 ? 'w-1/4 bg-danger' :
                    password.length < 12 ? 'w-2/4 bg-amber-400' :
                    password.length < 16 ? 'w-3/4 bg-accent-green/70' :
                    'w-full bg-accent-green'
                  )}
                />
              </div>
              <span className={cn(
                'text-[10px] font-medium shrink-0',
                password.length < 8 ? 'text-danger' :
                password.length < 12 ? 'text-amber-400' :
                'text-accent-green'
              )}>
                {password.length < 8 ? 'Too short' :
                 password.length < 12 ? 'Fair' :
                 password.length < 16 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}
          
          {error && <p className="text-danger text-xs text-left">{error}</p>}
          
          <div className="pt-1">
            <GlassButton type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </GlassButton>
          </div>
          <p className="text-white/30 text-xs text-center mt-2">
            Registration optional — join any group as a guest first
          </p>
        </form>

        <p className="text-white/40 text-sm mt-5 text-center w-full">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-white hover:text-accent transition-colors">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </AuthLayout>
  )
}
