'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Book } from '@/types/book'
import { useAuth } from './AuthContext'

interface Bookshelf {
  id: string
  name: string
  bookCount: number
}

interface BookshelfBook {
  id: string
  addedAt: string
  volumeInfo: Book['volumeInfo']
}

interface BookshelfContextType {
  bookshelves: Bookshelf[]
  addBookToShelf: (shelfId: string, book: Book) => Promise<boolean>
  removeBookFromShelf: (shelfId: string, bookId: string) => Promise<boolean>
  getBooksInShelf: (shelfId: string) => Promise<BookshelfBook[]>
  isLoading: boolean
  error: string | null
}

const BookshelfContext = createContext<BookshelfContextType | undefined>(undefined)

export function BookshelfProvider({ children }: { children: ReactNode }) {
  const { userId, isAuthenticated } = useAuth()
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch bookshelves when userId changes
  useEffect(() => {
    if (userId) {
      fetchBookshelves()
    }
  }, [userId, isAuthenticated])

  const fetchBookshelves = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      let response
      
      if (isAuthenticated) {
        // Use Google Books API for authenticated users
        response = await fetch('/api/mylibrary/bookshelves')
      } else {
        // Use local storage for non-authenticated users
        response = await fetch(`/api/bookshelves?user_id=${userId}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        setBookshelves([])
      } else {
        setBookshelves(data.items || [])
      }
    } catch (err) {
      setError('Failed to fetch bookshelves')
      setBookshelves([])
    } finally {
      setIsLoading(false)
    }
  }

  const addBookToShelf = async (shelfId: string, book: Book): Promise<boolean> => {
    try {
      if (isAuthenticated) {
        // Google Books API for authenticated users
        const response = await fetch(`/api/mylibrary/bookshelves/${shelfId}/addVolume?volumeId=${book.id}`, {
          method: 'POST'
        })
        
        if (!response.ok) {
          throw new Error('Failed to add book to shelf')
        }
      } else {
        // Local storage for non-authenticated users
        const bookData = {
          ...book,
          addedAt: new Date().toISOString()
        }
        
        const response = await fetch(`/api/bookshelves/${shelfId}/books?user_id=${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to add book to shelf')
        }
      }
      
      // Refresh bookshelves to update counts
      await fetchBookshelves()
      return true
    } catch (err) {
      console.error('Error adding book to shelf:', err)
      return false
    }
  }

  const removeBookFromShelf = async (shelfId: string, bookId: string): Promise<boolean> => {
    try {
      if (isAuthenticated) {
        // Google Books API for authenticated users
        const response = await fetch(`/api/mylibrary/bookshelves/${shelfId}/removeVolume?volumeId=${bookId}`, {
          method: 'POST'
        })
        
        if (!response.ok) {
          throw new Error('Failed to remove book from shelf')
        }
      } else {
        // Local storage for non-authenticated users
        const response = await fetch(`/api/bookshelves/${shelfId}/books/${bookId}?user_id=${userId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to remove book from shelf')
        }
      }
      
      // Refresh bookshelves to update counts
      await fetchBookshelves()
      return true
    } catch (err) {
      console.error('Error removing book from shelf:', err)
      return false
    }
  }

  const getBooksInShelf = async (shelfId: string): Promise<BookshelfBook[]> => {
    try {
      let response
      
      if (isAuthenticated) {
        // Google Books API for authenticated users
        response = await fetch(`/api/mylibrary/bookshelves/${shelfId}/volumes`)
      } else {
        // Local storage for non-authenticated users
        response = await fetch(`/api/bookshelves/${shelfId}/books?user_id=${userId}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Return standardized format
      if (isAuthenticated) {
        // Format Google Books API response
        return (data.items || []).map((item: Book) => ({
          id: item.id,
          addedAt: new Date().toISOString(), // Google API doesn't provide this
          volumeInfo: item.volumeInfo
        }))
      } else {
        // Local storage response
        return data.books || []
      }
    } catch (err) {
      console.error('Error fetching books in shelf:', err)
      return []
    }
  }

  return (
    <BookshelfContext.Provider value={{
      bookshelves,
      addBookToShelf,
      removeBookFromShelf,
      getBooksInShelf,
      isLoading,
      error
    }}>
      {children}
    </BookshelfContext.Provider>
  )
}

export function useBookshelf() {
  const context = useContext(BookshelfContext)
  if (context === undefined) {
    throw new Error('useBookshelf must be used within a BookshelfProvider')
  }
  return context
}
