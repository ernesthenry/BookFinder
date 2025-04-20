import { useState, useEffect, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  onSearch: (query: string) => void
  initialQuery?: string
}

export default function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load search history from localStorage on mount
  useEffect(() => {
    const history = localStorage.getItem('searchHistory')
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, 5))
    }
  }, [])

  // Save search to history
  const saveToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    const updatedHistory = [
      searchQuery,
      ...searchHistory.filter(item => item !== searchQuery)
    ].slice(0, 5)
    
    setSearchHistory(updatedHistory)
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory))
  }

  // Handle search submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    saveToHistory(query)
    onSearch(query)
    setShowSuggestions(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion)
    setShowSuggestions(false)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="w-full max-w-2xl relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
          <input
            type="text"
            className="w-full px-4 py-3 focus:outline-none"
            placeholder="Search for books by title, author, or ISBN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => searchHistory.length > 0 && setShowSuggestions(true)}
            aria-label="Search books"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 flex items-center transition-colors duration-200"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="ml-2 hidden md:inline">Search</span>
          </button>
        </div>
      </form>
      
      {/* Search history suggestions */}
      {showSuggestions && searchHistory.length > 0 && (
        <div 
          ref={suggestionRef}
          className="absolute w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg z-10"
        >
          <div className="p-2 text-xs text-gray-500 border-b">Recent searches</div>
          <ul>
            {searchHistory.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item}
                </button>
              </li>
            ))}
            <li className="border-t">
              <button
                onClick={() => {
                  localStorage.removeItem('searchHistory')
                  setSearchHistory([])
                  setShowSuggestions(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Clear search history
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}