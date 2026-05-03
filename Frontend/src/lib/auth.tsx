import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api, clearStoredToken, getStoredToken, setStoredToken, type LoginPayload, type RegisterPayload, type User } from "./api"

type AuthContextValue = {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(getStoredToken()))

  useEffect(() => {
    let active = true

    async function loadUser() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const profile = await api.auth.me()
        if (active) {
          setUser(profile)
        }
      } catch {
        clearStoredToken()
        if (active) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [token])

  const normalizeAuthUser = useCallback((response: Awaited<ReturnType<typeof api.auth.login>>): User | null => {
    if (response.user) {
      return response.user
    }

    if (response.user_id && response.email) {
      return {
        id: response.user_id,
        full_name: response.full_name,
        email: response.email,
        timezone: response.timezone,
      }
    }

    return null
  }, [])

  const refreshUser = useCallback(async () => {
    const profile = await api.auth.me()
    setUser(profile)
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await api.auth.login(payload)
    setStoredToken(response.access_token)
    setToken(response.access_token)
    setUser(normalizeAuthUser(response))
  }, [normalizeAuthUser])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await api.auth.register(payload)
    setStoredToken(response.access_token)
    setToken(response.access_token)
    setUser(normalizeAuthUser(response))
  }, [normalizeAuthUser])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      // Local logout still succeeds if the token is expired or the server is unavailable.
    } finally {
      clearStoredToken()
      setToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      register,
      refreshUser,
      setUser,
      logout,
    }),
    [isLoading, login, logout, refreshUser, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
