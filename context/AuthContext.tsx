'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface UserInfo {
  id: string
  name: string
  email: string
  picture?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: UserInfo | null
  userId: string
  login: () => void
  logout: () => void
  checkAuthStatus: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [userId, setUserId] = useState<string>('anonymous')

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      
      setIsAuthenticated(data.authenticated || false)
      setUser(data.user || null)
      
      // Set userId based on auth state
      if (data.authenticated && data.user && data.user.id) {
        setUserId(data.user.id)
      } else {
        // Generate a consistent anonymous ID using localStorage
        const storedId = localStorage.getItem('anonymousUserId')
        if (storedId) {
          setUserId(storedId)
        } else {
          const newId = `anon-${Math.random().toString(36).substring(2, 15)}`
          localStorage.setItem('anonymousUserId', newId)
          setUserId(newId)
        }
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
      setIsAuthenticated(false)
      setUser(null)
      
      // Ensure we have an anonymous ID
      const storedId = localStorage.getItem('anonymousUserId')
      if (storedId) {
        setUserId(storedId)
      } else {
        const newId = `anon-${Math.random().toString(36).substring(2, 15)}`
        localStorage.setItem('anonymousUserId', newId)
        setUserId(newId)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const login = () => {
    window.location.href = '/api/auth/login'
  }

  const logout = () => {
    window.location.href = '/api/auth/logout'
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      userId,
      login, 
      logout,
      checkAuthStatus,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
