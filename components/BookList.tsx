import { Book } from '@/types/book'
import BookCard from './BookCard'

interface BookListProps {
  books: Book[]
}

export default function BookList({ books }: BookListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}