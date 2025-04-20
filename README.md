# Google Books API - Full Stack Application

A full-stack application for interacting with the Google Books API, featuring a Flask backend API and a Next.js frontend.

## Features

- **Book Search**: Search for books using the Google Books API
- **Authentication**: Google OAuth integration for accessing user's Google Books library
- **Bookshelf Management**: Create and manage bookshelves with or without Google authentication
- **Local Storage**: Local bookshelf support for users without Google accounts
- **Responsive UI**: Modern interface built with Next.js

## Architecture

- **Backend**: Flask API server that interacts with the Google Books API
- **Frontend**: Next.js application for the user interface

## Prerequisites

- Python 3.7+
- Node.js 16+ and npm/yarn
- Google Books API key
- Google OAuth credentials (for authentication features)

## Backend Setup

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ernesthenry/BookFinder.git
   cd google-books-api-app/backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory:
   ```
   # Flask configuration
   FLASK_SECRET_KEY=your_secure_random_key
   FLASK_ENV=development

   # Google Books API configuration 
   GOOGLE_BOOKS_API_KEY=your_google_books_api_key

   # Google OAuth configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

   > **Note**: To generate a secure random key for `FLASK_SECRET_KEY`, you can use Python's `secrets` module:
   > ```python
   > import secrets
   > print(secrets.token_hex(16))
   > ```

### Running the Backend

Start the Flask server:

```bash
python app.py
```

The API server will be available at http://localhost:5328

## Frontend Setup

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend  # or wherever your Next.js app is located
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5328
   ```

### Running the Frontend

Start the Next.js development server:

```bash
npm run dev
# or
yarn dev
```

The frontend will be available at http://localhost:3000

## Getting API Keys

### Google Books API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Books API" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Create an API key and add it to your backend `.env` file

### Google OAuth Credentials

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "OAuth client ID"
3. Configure the OAuth consent screen if prompted
4. Select "Web application" as the application type
5. Add authorized redirect URIs:
   - `http://localhost:5328/api/auth/authorize` (for local development)
   - Your production callback URL if applicable
6. Create the client ID and add both the client ID and client secret to your backend `.env` file

## API Documentation

API documentation is available at the `/api/docs` endpoint when running the server. The main endpoints include:

### Volume Endpoints
- `/api/books/search` - Search for books
- `/api/books/<volume_id>` - Get specific volume details

### Local Bookshelf Endpoints
- `/api/bookshelves` - Get local bookshelves
- `/api/bookshelves/<shelf_id>/books` - Get or add books to a local bookshelf
- `/api/bookshelves/<shelf_id>/books/<book_id>` - Remove a book from a local bookshelf

### Authentication Endpoints
- `/api/auth/login` - Initiate OAuth2 login flow
- `/api/auth/authorize` - OAuth2 callback endpoint
- `/api/auth/logout` - Log out and clear session
- `/api/auth/status` - Check authentication status

### My Library Endpoints (Requires Authentication)
- `/api/mylibrary/bookshelves` - Get authenticated user's bookshelves
- `/api/mylibrary/bookshelves/<shelf_id>/volumes` - Get volumes in user's bookshelf
- `/api/mylibrary/bookshelves/<shelf_id>/addVolume` - Add a volume to user's bookshelf
- `/api/mylibrary/bookshelves/<shelf_id>/removeVolume` - Remove a volume from user's bookshelf
- `/api/mylibrary/bookshelves/<shelf_id>/clearVolumes` - Clear all volumes from user's bookshelf

## Connecting Frontend to Backend

The Next.js frontend communicates with the Flask backend through API calls. Make sure your backend server is running when developing the frontend.

### Example API Call from Next.js

```javascript
// Example of searching for books from a Next.js component
import { useState, useEffect } from 'react';

export default function BookSearch() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchBooks = async () => {
    if (!query) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setBooks(data.items || []);
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Book Search</h1>
      <input 
        type="text" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Search for books..."
      />
      <button onClick={searchBooks} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      <div className="results">
        {books.map(book => (
          <div key={book.id} className="book-card">
            <h3>{book.volumeInfo.title}</h3>
            {book.volumeInfo.authors && (
              <p>By {book.volumeInfo.authors.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## CORS Configuration

For local development, you may need to configure CORS in your Flask backend to allow requests from your Next.js frontend:

```python
# In your Flask app.py
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
```

Make sure to install the `flask-cors` package:
```bash
pip install flask-cors
```

## Deployment

### Backend Deployment

The Flask backend can be deployed to platforms like:
- Heroku
- AWS Elastic Beanstalk
- Google Cloud Run
- Digital Ocean App Platform

### Frontend Deployment

The Next.js frontend can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- GitHub Pages

Remember to update the environment variables in both your backend and frontend deployments.

## Error Handling

The application includes comprehensive error handling for:

- Missing environment variables
- API request failures
- Authentication issues
- Invalid parameters

Missing Google OAuth credentials will disable authentication features but the application will continue to function with local bookshelf support.

## Security Notes

- In production, always use HTTPS
- Store your API keys and secrets securely
- Replace the in-memory storage with a proper database
- Set appropriate CORS headers for your frontend

## License

[MIT License](LICENSE)