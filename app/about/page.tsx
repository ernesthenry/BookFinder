import Link from 'next/link'

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">About BookFinder</h1>
        
        <div className="prose lg:prose-lg">
          <p>
            BookFinder is a web application that allows you to search for books using the Google Books API.
            You can discover books by searching for titles, authors, or ISBNs, and view detailed information
            about each book.
          </p>
          
          <h2>Features</h2>
          <ul>
            <li>Search for books by title, author, or ISBN</li>
            <li>View book details including description, publication information, and cover images</li>
            <li>Access links to preview or purchase books</li>
            <li>Responsive design for all devices</li>
          </ul>
          
          <h2>How to Use</h2>
          <p>
            Simply enter your search query in the search bar on the homepage and press Enter or click the
            Search button. Browse through the search results and click on any book to view more details.
          </p>
          
          <h2>Technology Stack</h2>
          <p>
            BookFinder is built using Next.js for the frontend and Flask for the backend API.
            It utilizes the Google Books API to fetch book information.
          </p>
          
          <div className="mt-8">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
                                                 