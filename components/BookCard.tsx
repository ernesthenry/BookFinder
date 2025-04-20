import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types/book'

interface BookCardProps {
  book: Book
}

export default function BookCard({ book }: BookCardProps) {
  const { id, volumeInfo } = book
  const { title, authors, imageLinks, description, publishedDate } = volumeInfo || {}
  
  // Fallback image if no thumbnail is available
  const thumbnailUrl = imageLinks?.thumbnail || '/book-placeholder.png'
  
  return (
    <Link href={`/books/${id}`} className="block">
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        <div className="h-56 overflow-hidden bg-gray-100 relative">
          <Image
            src={thumbnailUrl}
            alt={title || 'Book cover'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain"
          />
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{title}</h3>
          {authors && (
            <p className="text-gray-600 mb-2 text-sm">{authors.join(', ')}</p>
          )}
          {publishedDate && (
            <p className="text-gray-500 text-xs mb-2">{publishedDate}</p>
          )}
          {description && (
            <p className="text-gray-700 text-sm line-clamp-3 mt-auto">
              {description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}