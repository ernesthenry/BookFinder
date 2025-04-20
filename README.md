# Google Books API - Flask Backend

A Flask application that serves as a backend for interacting with the Google Books API, providing book search functionality and bookshelf management.

## Features

- **Book Search**: Search for books using the Google Books API
- **Authentication**: Google OAuth integration for accessing user's Google Books library
- **Bookshelf Management**: Create and manage bookshelves with or without Google authentication
- **Local Storage**: Local bookshelf support for users without Google accounts

## Prerequisites

- Python 3.7+
- Google Books API key
- Google OAuth credentials (for authentication features)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/google-books-api-flask.git
   cd google-books-api-flask
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

4. Create a `.env` file in the project root directory:
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

## Getting API Keys

### Google Books API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Books API" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Create an API key and add it to your `.env` file

### Google OAuth Credentials

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "OAuth client ID"
3. Configure the OAuth consent screen if prompted
4. Select "Web application" as the application type
5. Add authorized redirect URIs:
   - `http://localhost:5328/api/auth/authorize` (for local development)
   - Your production callback URL if applicable
6. Create the client ID and add both the client ID and client secret to your `.env` file

## Running the Application

Start the Flask server:

```bash
python app.py
```

The server will be available at http://localhost:5328

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