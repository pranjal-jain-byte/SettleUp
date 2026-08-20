import { createContext, useState, useEffect } from 'react'
import { authService } from '../services/auth.service'
import { setAccessToken, getAccessToken } from '../api/tokenStore.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const updateToken = (newToken) => {
    setAccessToken(newToken)
    setToken(newToken)
  }

  useEffect(() => {
    authService.getMe()
      .then(res => {
        setUser(res.data)
        setToken(getAccessToken())
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await authService.login(email, password)
    updateToken(res.data.accessToken)
    setUser(res.data)
  }

  const register = async (username, email, password) => {
    const res = await authService.register(username, email, password)
    updateToken(res.data.accessToken)
    setUser(res.data)
  }

  const loginAsGuest = async (displayName) => {
    const guestId = localStorage.getItem('settleup_guest_id')
    const res = await authService.loginAsGuest(displayName, guestId)
    updateToken(res.data.accessToken)
    setUser(res.data)
    localStorage.setItem('settleup_guest_id', res.data._id)
  }

  const logout = async () => {
    await authService.logout()
    updateToken(null)
    setUser(null)
  }

  const upgrade = async (username, email, password) => {
    const res = await authService.upgradeGuest(username, email, password)
    if(res.data.accessToken){
      updateToken(res.data.accessToken)
    }
    setUser(res.data)
  }

  const updateUser = (updatedData) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginAsGuest, logout, upgrade, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
