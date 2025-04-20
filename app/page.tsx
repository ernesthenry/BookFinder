'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import BookList from '@/components/BookList'
import { Book } from '@/types/book'
import { Yesteryear } from 'next/font/google'

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setIsLoading(true)
    setError(null)
    setSearchQuery(query)
    
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        setBooks([])
      } else {
        setBooks(data.items || [])
      }
    } catch (err) {
      setError('Failed to fetch books. Please try again.')
      setBooks([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col items-center justify-center py-8 mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">BookFinder</h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Discover and explore your next favorite book
          </p>
          
          <SearchBar onSearch={handleSearch} />
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4">
            {error}
          </div>
        )}

        {books.length > 0 && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4">
              {books.length} results for "{searchQuery}"
            </h2>
            <BookList books={books} />
          </div>
        )}

        {!isLoading && !error && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-6">
              <Image
                src="/books-illustration.svg"
                alt="Books"
                width={300}
                height={200}
                priority
              />
            </div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">
              Search for books to get started
            </h2>
            <p className="text-gray-500">
              Try searching by title, author, or ISBN
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
                                                                                                          