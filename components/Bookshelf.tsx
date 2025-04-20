'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types/book'

interface BookshelfProps {
  userId?: string
  shelfId: string
  shelfName: string
}

interface ShelfBook {
  id: string
  addedAt: string
  volumeInfo: Book['volumeInfo']
}

export default function Bookshelf({ userId = 'anonymous', shelfId, shelfName }: BookshelfProps) {
  const [books, setBooks] = useState<ShelfBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/bookshelves/${shelfId}/books?user_id=${userId}`)
        const data = await response.json()
        
        if (data.error) {
          setError(data.error)
          setBooks([])
        } else {
          setBooks(data.books || [])
        }
      } catch (err) {
        setError('Failed to fetch bookshelf data')
        setBooks([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBooks()
  }, [shelfId, userId])
  
  const removeBookFromShelf = async (bookId: string) => {
    try {
      await fetch(`/api/bookshelves/${shelfId}/books/${bookId}?user_id=${userId}`, {
        method: 'DELETE'
      })
      
      // Filter out the removed book
      setBooks(books.filter(book => book.id !== bookId))
    } catch (err) {
      setError('Failed to remove book from shelf')
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4">
        {error}
      </div>
    )
  }
  
  if (books.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">{shelfName}</h2>
        <p className="text-gray-500">No books in this shelf yet.</p>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-4">{shelfName}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <div key={book.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
            <Link href={`/books/${book.id}`} className="block h-48 overflow-hidden bg-gray-100 relative">
              <Image
                src={book.volumeInfo.imageLinks?.thumbnail || '/book-placeholder.png'}
                alt={book.volumeInfo.title || 'Book cover'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-contain"
              />
            </Link>
            <div className="p-4 flex-grow flex flex-col">
              <Link href={`/books/${book.id}`} className="font-semibold text-lg mb-1 line-clamp-2 hover:text-blue-600">
                {book.volumeInfo.title}
              </Link>
              {book.volumeInfo.authors && (
                <p className="text-gray-600 mb-2 text-sm">{book.volumeInfo.authors.join(', ')}</p>
              )}
              <div className="mt-auto flex justify-between pt-4">
                <Link href={`/books/${book.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                  View details
                </Link>
                <button 
                  onClick={() => removeBookFromShelf(book.id)} 
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
