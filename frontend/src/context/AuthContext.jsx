import { createContext, useContext, useEffect, useState } from 'react'
import {
  login as loginRequest,
  signup as signupRequest,
  verifyEmail as verifyEmailRequest,
} from '../services/authService.js'
import { getCurrentUser } from '../services/userService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(sessionStorage.getItem('token')),
  )
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!sessionStorage.getItem('token')) {
      return
    }

    let isCurrent = true

    getCurrentUser()
      .then((currentUser) => {
        if (isCurrent) {
          setUser(currentUser)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          sessionStorage.removeItem('token')
          setAuthError(error.message || 'Could not restore your session.')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  async function establishSession(data) {
    if (!data?.token) {
      throw new Error('The server did not return an authentication token.')
    }

    sessionStorage.setItem('token', data.token)

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      sessionStorage.removeItem('token')
      throw error
    }
  }

  async function login(credentials) {
    setAuthError('')
    const data = await loginRequest(credentials)
    return establishSession(data)
  }

  async function signup(userDetails) {
    setAuthError('')
    return signupRequest(userDetails)
  }

  async function verifyEmail(credentials) {
    setAuthError('')
    const data = await verifyEmailRequest(credentials)
    return establishSession(data)
  }

  function updateUser(updates) {
    setUser((currentUser) =>
      currentUser ? { ...currentUser, ...updates } : currentUser,
    )
  }

  function logout() {
    sessionStorage.removeItem('token')
    setUser(null)
    setAuthError('')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authError,
        login,
        signup,
        verifyEmail,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}