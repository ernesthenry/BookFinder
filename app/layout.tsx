import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'BookFinder | Discover Your Next Read',
  description: 'Search and discover books from various genres and authors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-blue-700 text-white">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              BookFinder
            </Link>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <Link href="/" className="hover:text-blue-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-blue-200">
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        
        <div className="min-h-screen bg-gray-50">{children}</div>
        
        <footer className="bg-gray-800 text-white">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:justify-between items-center">
              <div className="mb-4 md:mb-0">
                <Link href="/" className="text-lg font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  BookFinder
                </Link>
                <p className="text-sm text-gray-400 mt-2">
                  Discover your next favorite book
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">
                  &copy; {new Date().getFullYear()} BookFinder. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
