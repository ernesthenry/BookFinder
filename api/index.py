from flask import Flask, request, jsonify, redirect, url_for, session
import requests
import os
import json
from functools import wraps
from authlib.integrations.flask_client import OAuth
from urllib.parse import urlencode
import uuid
from dotenv import load_dotenv
import secrets

load_dotenv()

app = Flask(__name__)
# Use a secure random key if environment variable is not set
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(16)

# Google Books API base URLs
GOOGLE_BOOKS_API_BASE_URL = "https://www.googleapis.com/books/v1"
VOLUMES_ENDPOINT = f"{GOOGLE_BOOKS_API_BASE_URL}/volumes"
BOOKSHELF_ENDPOINT = f"{GOOGLE_BOOKS_API_BASE_URL}/users"
MY_LIBRARY_ENDPOINT = f"{GOOGLE_BOOKS_API_BASE_URL}/mylibrary/bookshelves"

# Load API keys and secrets from environment variables
API_KEY = os.environ.get("GOOGLE_BOOKS_API_KEY")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

# Warn if required environment variables are missing
if not API_KEY:
    print("WARNING: GOOGLE_BOOKS_API_KEY not set. API requests may be rate-limited.")
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    print("WARNING: Google OAuth credentials not configured. Authentication features will not work.")

# In-memory storage for non-authenticated users (replace with database in production)
LOCAL_BOOKSHELVES = {
    # Format: user_id: { shelf_id: { name: "shelf_name", books: [book1, book2, ...] } }
}

# Default bookshelves for new users
DEFAULT_SHELVES = {
    "reading": {"name": "Currently Reading", "books": []},
    "to-read": {"name": "Want to Read", "books": []},
    "read": {"name": "Read", "books": []}
}

# OAuth setup
oauth = OAuth(app)

# Only register Google OAuth if credentials are available
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    google = oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        access_token_url='https://accounts.google.com/o/oauth2/token',
        access_token_params=None,
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        authorize_params=None,
        api_base_url='https://www.googleapis.com/oauth2/v1/',
        client_kwargs={'scope': 'https://www.googleapis.com/auth/books'}
    )

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'access_token' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Helper function to get or create user's bookshelves
def get_user_local_bookshelves(user_id):
    if user_id not in LOCAL_BOOKSHELVES:
        LOCAL_BOOKSHELVES[user_id] = DEFAULT_SHELVES.copy()
    return LOCAL_BOOKSHELVES[user_id]

# Authentication routes
@app.route('/api/auth/login')
def login():
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return jsonify({"error": "OAuth credentials not configured"}), 503
        
    redirect_uri = url_for('authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/api/auth/authorize')
def authorize():
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return jsonify({"error": "OAuth credentials not configured"}), 503
        
    token = google.authorize_access_token()
    session['access_token'] = token['access_token']
    # Get user info
    resp = google.get('userinfo')
    user_info = resp.json()
    session['user_info'] = user_info
    return redirect('/')  # Redirect to frontend

@app.route('/api/auth/logout')
def logout():
    session.pop('access_token', None)
    session.pop('user_info', None)
    return redirect('/')

@app.route('/api/auth/status')
def auth_status():
    if 'access_token' in session and 'user_info' in session:
        return jsonify({
            "authenticated": True,
            "user": session['user_info']
        })
    return jsonify({
        "authenticated": False,
        "oauth_configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
    })

# Helper function for API requests
def make_api_request(url, method="GET", data=None):
    headers = {}
    
    # Add auth token if available in session
    if 'access_token' in session:
        headers['Authorization'] = f"Bearer {session['access_token']}"
        
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            headers['Content-Type'] = 'application/json'
            response = requests.post(url, headers=headers, json=data if data else {}, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        
        if response.status_code == 204:  # No content response
            return {}, 204
            
        return response.json(), response.status_code
    except requests.exceptions.Timeout:
        return {"error": "Request timed out"}, 504
    except requests.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}, 500
    except Exception as e:
        return {"error": str(e)}, 500

# Volume endpoints
@app.route("/api/books/search")
def search_books():
    # Required parameter
    query = request.args.get("q", "")
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    
    # Optional parameters with improved defaults
    params = {
        "q": query,
        "startIndex": request.args.get("startIndex", "0"),
        "maxResults": request.args.get("maxResults", "40"),  # Increased results
        "orderBy": request.args.get("orderBy", "relevance"),
        "printType": request.args.get("printType", "books"),  # Default to books only
    }
    
    # Additional optional parameters
    for param in ["filter", "projection", "download", "langRestrict"]:
        if request.args.get(param):
            params[param] = request.args.get(param)
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{VOLUMES_ENDPOINT}?{urlencode(params)}"
    
    try:
        # Add timeout to prevent long-running requests
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return jsonify({
                "error": f"Google Books API returned an error: {response.status_code}"
            }), response.status_code
            
        data = response.json()
        
        # Add basic caching header
        cache_response = jsonify(data)
        cache_response.headers["Cache-Control"] = "public, max-age=300"
        return cache_response
        
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request to Google Books API timed out"}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error connecting to Google Books API: {str(e)}"}), 502
    except ValueError as e:  # JSON parsing error
        return jsonify({"error": "Invalid response from Google Books API"}), 502

@app.route("/api/books/<volume_id>")
def get_book_details(volume_id):
    params = {}
    
    # Optional projection parameter
    if request.args.get("projection"):
        params["projection"] = request.args.get("projection")
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{VOLUMES_ENDPOINT}/{volume_id}"
    if params:
        url += f"?{urlencode(params)}"
    
    try:
        # Add timeout to prevent long-running requests
        response = requests.get(url, timeout=10)
        
        if response.status_code == 404:
            return jsonify({"error": "Book not found"}), 404
        
        if response.status_code != 200:
            return jsonify({
                "error": f"Google Books API returned an error: {response.status_code}"
            }), response.status_code
            
        data = response.json()
        
        # Add basic caching header
        cache_response = jsonify(data)
        cache_response.headers["Cache-Control"] = "public, max-age=3600"  # Cache for 1 hour
        return cache_response
        
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request to Google Books API timed out"}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error connecting to Google Books API: {str(e)}"}), 502
    except ValueError as e:  # JSON parsing error
        return jsonify({"error": "Invalid response from Google Books API"}), 502

# Local bookshelf endpoints (for non-authenticated users)
@app.route("/api/bookshelves")
def get_local_bookshelves():
    user_id = request.args.get("user_id", "anonymous")
    bookshelves = get_user_local_bookshelves(user_id)
    
    result = []
    for shelf_id, shelf_data in bookshelves.items():
        result.append({
            "id": shelf_id,
            "name": shelf_data["name"],
            "bookCount": len(shelf_data["books"])
        })
    
    return jsonify({"items": result})

@app.route("/api/bookshelves/<shelf_id>/books")
def get_local_bookshelf_books(shelf_id):
    user_id = request.args.get("user_id", "anonymous")
    bookshelves = get_user_local_bookshelves(user_id)
    
    if shelf_id not in bookshelves:
        return jsonify({"error": "Bookshelf not found"}), 404
    
    return jsonify({"books": bookshelves[shelf_id]["books"]})

@app.route("/api/bookshelves/<shelf_id>/books", methods=["POST"])
def add_book_to_local_bookshelf(shelf_id):
    user_id = request.args.get("user_id", "anonymous")
    data = request.json
    
    if not data or "volumeInfo" not in data:
        return jsonify({"error": "Book data is required"}), 400
    
    bookshelves = get_user_local_bookshelves(user_id)
    
    if shelf_id not in bookshelves:
        return jsonify({"error": "Bookshelf not found"}), 404
    
    # Add the book with a timestamp
    book_entry = {
        "id": data.get("id", str(uuid.uuid4())),
        "addedAt": data.get("addedAt", ""),
        "volumeInfo": data["volumeInfo"]
    }
    
    # Check if book already exists in shelf
    book_ids = [book["id"] for book in bookshelves[shelf_id]["books"]]
    if book_entry["id"] not in book_ids:
        bookshelves[shelf_id]["books"].append(book_entry)
    
    return jsonify({"success": True, "bookshelf": bookshelves[shelf_id]})

@app.route("/api/bookshelves/<shelf_id>/books/<book_id>", methods=["DELETE"])
def remove_book_from_local_bookshelf(shelf_id, book_id):
    user_id = request.args.get("user_id", "anonymous")
    bookshelves = get_user_local_bookshelves(user_id)
    
    if shelf_id not in bookshelves:
        return jsonify({"error": "Bookshelf not found"}), 404
    
    # Filter out the book to remove
    bookshelves[shelf_id]["books"] = [
        book for book in bookshelves[shelf_id]["books"] 
        if book["id"] != book_id
    ]
    
    return jsonify({"success": True})

# Public bookshelf endpoints (Google Books API)
@app.route("/api/users/<user_id>/bookshelves")
def get_user_bookshelves(user_id):
    params = {}
    
    # Add pagination parameters if provided
    if request.args.get("startIndex"):
        params["startIndex"] = request.args.get("startIndex")
    if request.args.get("maxResults"):
        params["maxResults"] = request.args.get("maxResults")
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{BOOKSHELF_ENDPOINT}/{user_id}/bookshelves"
    if params:
        url += f"?{urlencode(params)}"
    
    data, status_code = make_api_request(url)
    return jsonify(data), status_code

@app.route("/api/users/<user_id>/bookshelves/<shelf_id>")
def get_user_bookshelf(user_id, shelf_id):
    params = {}
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{BOOKSHELF_ENDPOINT}/{user_id}/bookshelves/{shelf_id}"
    if params:
        url += f"?{urlencode(params)}"
    
    data, status_code = make_api_request(url)
    return jsonify(data), status_code

@app.route("/api/users/<user_id>/bookshelves/<shelf_id>/volumes")
def get_user_bookshelf_volumes(user_id, shelf_id):
    params = {}
    
    # Add pagination parameters if provided
    if request.args.get("startIndex"):
        params["startIndex"] = request.args.get("startIndex")
    if request.args.get("maxResults"):
        params["maxResults"] = request.args.get("maxResults")
    
    # Optional projection parameter
    if request.args.get("projection"):
        params["projection"] = request.args.get("projection")
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{BOOKSHELF_ENDPOINT}/{user_id}/bookshelves/{shelf_id}/volumes"
    if params:
        url += f"?{urlencode(params)}"
    
    data, status_code = make_api_request(url)
    return jsonify(data), status_code

# "My Library" endpoints (authenticated)
@app.route("/api/mylibrary/bookshelves")
@login_required
def get_my_bookshelves():
    params = {}
    
    # Add pagination parameters if provided
    if request.args.get("startIndex"):
        params["startIndex"] = request.args.get("startIndex")
    if request.args.get("maxResults"):
        params["maxResults"] = request.args.get("maxResults")
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{MY_LIBRARY_ENDPOINT}"
    if params:
        url += f"?{urlencode(params)}"
    
    data, status_code = make_api_request(url)
    return jsonify(data), status_code

@app.route("/api/mylibrary/bookshelves/<shelf_id>/volumes")
@login_required
def get_my_bookshelf_volumes(shelf_id):
    params = {}
    
    # Add pagination parameters if provided
    if request.args.get("startIndex"):
        params["startIndex"] = request.args.get("startIndex")
    if request.args.get("maxResults"):
        params["maxResults"] = request.args.get("maxResults")
    
    # Optional projection parameter
    if request.args.get("projection"):
        params["projection"] = request.args.get("projection")
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{MY_LIBRARY_ENDPOINT}/{shelf_id}/volumes"
    if params:
        url += f"?{urlencode(params)}"
    
    data, status_code = make_api_request(url)
    return jsonify(data), status_code

@app.route("/api/mylibrary/bookshelves/<shelf_id>/addVolume", methods=["POST"])
@login_required
def add_volume_to_my_bookshelf(shelf_id):
    volume_id = request.args.get("volumeId")
    if not volume_id:
        return jsonify({"error": "volumeId query parameter is required"}), 400
    
    params = {"volumeId": volume_id}
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{MY_LIBRARY_ENDPOINT}/{shelf_id}/addVolume?{urlencode(params)}"
    
    data, status_code = make_api_request(url, method="POST")
    return jsonify(data), status_code

@app.route("/api/mylibrary/bookshelves/<shelf_id>/removeVolume", methods=["POST"])
@login_required
def remove_volume_from_my_bookshelf(shelf_id):
    volume_id = request.args.get("volumeId")
    if not volume_id:
        return jsonify({"error": "volumeId query parameter is required"}), 400
    
    params = {"volumeId": volume_id}
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{MY_LIBRARY_ENDPOINT}/{shelf_id}/removeVolume?{urlencode(params)}"
    
    data, status_code = make_api_request(url, method="POST")
    return jsonify(data), status_code

@app.route("/api/mylibrary/bookshelves/<shelf_id>/clearVolumes", methods=["POST"])
@login_required
def clear_my_bookshelf(shelf_id):
    params = {}
    
    # Add API key if available
    if API_KEY:
        params["key"] = API_KEY
    
    url = f"{MY_LIBRARY_ENDPOINT}/{shelf_id}/clearVolumes"
    if params:
        url += f"?{urlencode(params)}"
    
    data, status_code = make_api_request(url, method="POST")
    return jsonify(data), status_code

@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "ok",
        "api_key_configured": bool(API_KEY),
        "oauth_configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
    })

@app.route("/api/docs")
def api_docs():
    # Simple API documentation
    endpoints = {
        "Volume Endpoints": {
            "/api/books/search": {
                "methods": ["GET"],
                "description": "Search for books",
                "query_params": ["q (required)", "startIndex", "maxResults", "orderBy", "filter", "printType", "projection", "download", "langRestrict"]
            },
            "/api/books/<volume_id>": {
                "methods": ["GET"],
                "description": "Get specific volume details",
                "query_params": ["projection"]
            }
        },
        "Local Bookshelf Endpoints": {
            "/api/bookshelves": {
                "methods": ["GET"],
                "description": "Get local bookshelves",
                "query_params": ["user_id"]
            },
            "/api/bookshelves/<shelf_id>/books": {
                "methods": ["GET", "POST"],
                "description": "Get or add books to a local bookshelf",
                "query_params": ["user_id"]
            },
            "/api/bookshelves/<shelf_id>/books/<book_id>": {
                "methods": ["DELETE"],
                "description": "Remove a book from a local bookshelf",
                "query_params": ["user_id"]
            }
        },
        "Public Bookshelf Endpoints": {
            "/api/users/<user_id>/bookshelves": {
                "methods": ["GET"],
                "description": "Get a user's public bookshelves",
                "query_params": ["startIndex", "maxResults"]
            },
            "/api/users/<user_id>/bookshelves/<shelf_id>": {
                "methods": ["GET"],
                "description": "Get a specific public bookshelf",
                "query_params": []
            },
            "/api/users/<user_id>/bookshelves/<shelf_id>/volumes": {
                "methods": ["GET"],
                "description": "Get volumes in a public bookshelf",
                "query_params": ["startIndex", "maxResults", "projection"]
            }
        },
        "My Library Endpoints (Requires Authentication)": {
            "/api/mylibrary/bookshelves": {
                "methods": ["GET"],
                "description": "Get authenticated user's bookshelves",
                "query_params": ["startIndex", "maxResults"]
            },
            "/api/mylibrary/bookshelves/<shelf_id>/volumes": {
                "methods": ["GET"],
                "description": "Get volumes in user's bookshelf",
                "query_params": ["startIndex", "maxResults", "projection"]
            },
            "/api/mylibrary/bookshelves/<shelf_id>/addVolume": {
                "methods": ["POST"],
                "description": "Add a volume to user's bookshelf",
                "query_params": ["volumeId (required)"]
            },
            "/api/mylibrary/bookshelves/<shelf_id>/removeVolume": {
                "methods": ["POST"],
                "description": "Remove a volume from user's bookshelf",
                "query_params": ["volumeId (required)"]
            },
            "/api/mylibrary/bookshelves/<shelf_id>/clearVolumes": {
                "methods": ["POST"],
                "description": "Clear all volumes from user's bookshelf",
                "query_params": []
            }
        },
        "Authentication Endpoints": {
            "/api/auth/login": {
                "methods": ["GET"],
                "description": "Initiate OAuth2 login flow"
            },
            "/api/auth/authorize": {
                "methods": ["GET"],
                "description": "OAuth2 callback endpoint"
            },
            "/api/auth/logout": {
                "methods": ["GET"],
                "description": "Log out and clear session"
            },
            "/api/auth/status": {
                "methods": ["GET"],
                "description": "Check authentication status"
            }
        },
        "Utility Endpoints": {
            "/api/health": {
                "methods": ["GET"],
                "description": "Health check endpoint"
            },
            "/api/docs": {
                "methods": ["GET"],
                "description": "This API documentation"
            }
        }
    }
    
    return jsonify(endpoints)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5328))
    app.run(host="0.0.0.0", port=port, debug=(os.environ.get("FLASK_ENV") == "development"))
