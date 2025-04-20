'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Book } from '@/types/book'
import BookList from '@/components/BookList'

export default function BookDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [book, setBook] = useState<Book | null>(null)
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookDetails() {
      if (!id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/books/${id}`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.error) {
          setError(data.error)
          setBook(null)
        } else {
          setBook(data)
          
          // After getting book details, fetch related books by author or category
          if (data.volumeInfo.authors?.length > 0 || data.volumeInfo.categories?.length > 0) {
            fetchRelatedBooks(data)
          }
        }
      } catch (err) {
        console.error('Error fetching book details:', err)
        setError('Failed to fetch book details. Please try again.')
        setBook(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookDetails()
  }, [id])
  
  // Fetch related books based on author or category
  async function fetchRelatedBooks(bookData: Book) {
    try {
      let query = ''
      
      // Prefer to search by first author
      if (bookData.volumeInfo.authors?.length > 0) {
        query = `inauthor:"${bookData.volumeInfo.authors[0]}"`
      } 
      // Fall back to first category
      else if (bookData.volumeInfo.categories?.length > 0) {
        query = `subject:"${bookData.volumeInfo.categories[0]}"`
      }
      
      if (query) {
        const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}&maxResults=6`)
        const data = await response.json()
        
        if (data.items) {
          // Filter out the current book and limit to 5 books
          setRelatedBooks(
            data.items
              .filter((item: Book) => item.id !== bookData.id)
              .slice(0, 5)
          )
        }
      }
    } catch (err) {
      console.error('Error fetching related books:', err)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="font-medium">Error:</span> {error}
        </div>
        <div className="mt-4">
          <button 
            onClick={handleGoBack}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          Book not found
        </div>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to search
          </Link>
        </div>
      </div>
    )
  }

  const { volumeInfo, saleInfo, accessInfo } = book
  const {
    title,
    subtitle,
    authors,
    description,
    publisher,
    publishedDate,
    pageCount,
    categories,
    averageRating,
    ratingsCount,
    imageLinks,
    language,
    previewLink,
    infoLink
  } = volumeInfo
  
  const thumbnailUrl = imageLinks?.thumbnail || '/book-placeholder.png'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button 
          onClick={handleGoBack}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Go back
        </button>
      </div>
      
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 p-4 bg-gray-50 flex justify-center items-start">
            <div className="relative h-72 w-48 shadow-md">
              <Image
                src={thumbnailUrl}
                alt={title || 'Book cover'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 300px"
              />
            </div>
          </div>
          <div className="md:w-2/3 p-6">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {subtitle && <h2 className="text-xl text-gray-700 mb-4">{subtitle}</h2>}
            
            {authors && (
              <p className="text-gray-600 mb-4">
                <span className="font-semibold">By:</span> {authors.join(', ')}
              </p>
            )}
            
            {description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: description }}></div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {publisher && (
                <div>
                  <p className="font-semibold">Publisher:</p>
                  <p className="text-gray-700">{publisher}</p>
                </div>
              )}
              
              {publishedDate && (
                <div>
                  <p className="font-semibold">Published Date:</p>
                  <p className="text-gray-700">{publishedDate}</p>
                </div>
              )}
              
              {pageCount && (
                <div>
                  <p className="font-semibold">Pages:</p>
                  <p className="text-gray-700">{pageCount}</p>
                </div>
              )}
              
              {language && (
                <div>
                  <p className="font-semibold">Language:</p>
                  <p className="text-gray-700">{language.toUpperCase()}</p>
                </div>
              )}
            </div>
            
            {categories && categories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {averageRating && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Rating</h3>
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(averageRating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-700">
                    {averageRating} out of 5 ({ratingsCount} reviews)
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
              {previewLink && (
                
                  href={previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Preview Book
                </a>
              )}
              
              {infoLink && (
                
                  href={infoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  More Info
                </a>
              )}
              
              {saleInfo?.buyLink && (
                
                  href={saleInfo.buyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  Buy Book
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Books Section */}
      {relatedBooks.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">You might also like</h2>
          <BookList books={relatedBooks} />
        </div>
      )}
    </div>
  )
}
