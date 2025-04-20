'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import BookList from '@/components/BookList'
import { Book } from '@/types/book'

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      handleSearch(query)
    }
  }, [searchParams])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setIsLoading(true)
    setError(null)
    setSearchQuery(query)
    
    // Update URL with search query
    router.push(`/?q=${encodeURIComponent(query)}`, { scroll: false })
    
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}&maxResults=40`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        setBooks([])
        setTotalResults(0)
      } else {
        setBooks(data.items || [])
        setTotalResults(data.totalItems || 0)
      }
    } catch (err) {
      setError('Failed to fetch books. Please try again.')
      setBooks([])
      setTotalResults(0)
      console.error('Search error:', err)
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
          
          <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4">
            <span className="font-medium">Error:</span> {error}
            <button 
              className="ml-4 text-red-700 underline"
              onClick={() => handleSearch(searchQuery)}
            >
              Try again
            </button>
          </div>
        )}

        {books.length > 0 && !isLoading && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4">
              {totalResults > 0 ? `Found ${totalResults} books` : books.length} results for "{searchQuery}"
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
            {searchQuery ? (
              <>
                <h2 className="text-xl font-medium text-gray-700 mb-2">
                  No books found for "{searchQuery}"
                </h2>
                <p className="text-gray-500">
                  Try using different keywords or check your spelling
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-medium text-gray-700 mb-2">
                  Search for books to get started
                </h2>
                <p className="text-gray-500">
                  Try searching by title, author, or ISBN
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
