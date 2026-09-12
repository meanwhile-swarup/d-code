import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { auth, setToken, clearToken } from "../api/client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("dcode_token")
    if (token) {
      auth.me()
        .then(setUser)
        .catch(() => clearToken())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await auth.login({ email, password })
    setToken(res.token)
    setUser(res.user)
    return res
  }, [])

  const signup = useCallback(async (username, email, password, name) => {
    const res = await auth.signup({ username, email, password, name })
    setToken(res.token)
    setUser(res.user)
    return res
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
