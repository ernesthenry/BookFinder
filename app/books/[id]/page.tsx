// app/books/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Book } from '@/types/book'

export default function BookDetail() {
  const { id } = useParams()
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookDetails() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/books/${id}`)
        const data = await response.json()
        
        if (data.error) {
          setError(data.error)
        } else {
          setBook(data)
        }
      } catch (err) {
        setError('Failed to fetch book details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchBookDetails()
    }
  }, [id])

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
          {error}
        </div>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to search
          </Link>
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
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to search
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 p-4 bg-gray-50 flex justify-center">
            <div className="relative h-72 w-48">
              <Image
                src={thumbnailUrl}
                alt={title || 'Book cover'}
                fill
                className="object-contain"
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
                <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: description }}></p>
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
                <a
                  href={previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Preview Book
                </a>
              )}
              
              {infoLink && (
                <a
                  href={infoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  More Info
                </a>
              )}
              
              {saleInfo?.buyLink && (
                <a
                  href={saleInfo.buyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Buy Book
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
