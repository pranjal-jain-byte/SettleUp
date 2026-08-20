import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import AuthLayout from '../layouts/AuthLayout'
import GlassCard from '../components/shared/GlassCard'
import GlassInput from '../components/shared/GlassInput'
import PasswordInput from '../components/shared/PasswordInput'
import GlassButton from '../components/shared/GlassButton'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStep1 = (e) => {
    e.preventDefault()
    if (email) {
      setError('')
      setStep(2)
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      await login(email, password)
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login')
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <GlassCard className="max-w-sm w-full p-8 flex flex-col items-start">
        <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center mb-4">
          <LogIn className="text-white" size={20} />
        </div>

        <h1 className="font-display text-xl font-bold tracking-tight text-white mb-1 text-left">
          Welcome to SettleUp
        </h1>
        <p className="text-white/50 text-sm mb-5 text-left">
          Please sign in or sign up below.
        </p>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="w-full space-y-3">
            <GlassInput
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            {error && <p className="text-danger text-xs text-left">{error}</p>}
            <GlassButton type="submit">
              Continue with Email
            </GlassButton>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="w-full space-y-3">
            <p className="text-sm text-white/70 bg-white/[0.04] p-2 rounded-lg border border-white/[0.05]">{email}</p>
            <PasswordInput
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
            {error && <p className="text-danger text-xs text-left">{error}</p>}
            <div className="flex gap-2">
              <GlassButton type="button" variant="ghost" onClick={() => setStep(1)} className="w-1/3">
                Back
              </GlassButton>
              <GlassButton type="submit" disabled={loading} className="w-2/3">
                {loading ? 'Signing in...' : 'Sign in'}
              </GlassButton>
            </div>
          </form>
        )}

        {step === 1 && (
          <>
            <div className="w-full flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-white/[0.10]"></div>
            </div>

            <GlassButton variant="ghost" onClick={() => navigate(ROUTES.HOME)}>
              Continue as guest
            </GlassButton>

            <p className="text-white/40 text-sm mt-5 text-center w-full">
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} className="text-white hover:text-accent transition-colors">
                Register
              </Link>
            </p>
          </>
        )}
      </GlassCard>
    </AuthLayout>
  )
}
