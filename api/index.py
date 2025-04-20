from flask import Flask, request, jsonify
import requests
import os
from datetime import datetime
import uuid

app = Flask(__name__)

# Google Books API base URL
GOOGLE_BOOKS_API_BASE_URL = "https://www.googleapis.com/books/v1/volumes"
# In production, store your API key securely
API_KEY = os.environ.get("GOOGLE_BOOKS_API_KEY", "")

# Simple in-memory storage for favorites and reading lists
# In a production app, this would be a database
user_favorites = {}
user_reading_list = {}
user_book_shelf = {}
user_notes = {}
user_reviews = {}

@app.route("/api/books/search")
def search_books():
    query = request.args.get("q", "")
    start_index = request.args.get("startIndex", "0")
    max_results = request.args.get("maxResults", "10")
    order_by = request.args.get("orderBy", "relevance")
    filter_param = request.args.get("filter", "")
    
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    
    # Construct the API URL with parameters
    url = f"{GOOGLE_BOOKS_API_BASE_URL}?q={query}&startIndex={start_index}&maxResults={max_results}"
    
    if order_by:
        url += f"&orderBy={order_by}"
    
    if filter_param:
        url += f"&filter={filter_param}"
    
    # Add API key if available
    if API_KEY:
        url += f"&key={API_KEY}"
    
    try:
        response = requests.get(url)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/books/<volume_id>")
def get_book_details(volume_id):
    url = f"{GOOGLE_BOOKS_API_BASE_URL}/{volume_id}"
    
    # Add API key if available
    if API_KEY:
        url += f"?key={API_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        # Append user-specific data if available
        user_id = request.args.get("user_id", "anonymous")
        
        # Check if book is in user's favorites
        if user_id in user_favorites and volume_id in user_favorites[user_id]:
            data["userInfo"] = {"isFavorite": True}
        
        # Check if book is in user's reading list
        if user_id in user_reading_list and volume_id in user_reading_list[user_id]:
            if "userInfo" not in data:
                data["userInfo"] = {}
            data["userInfo"]["inReadingList"] = True
            data["userInfo"]["readingStatus"] = user_reading_list[user_id][volume_id]["status"]
        
        # Get user notes for this book
        if user_id in user_notes and volume_id in user_notes[user_id]:
            if "userInfo" not in data:
                data["userInfo"] = {}
            data["userInfo"]["notes"] = user_notes[user_id][volume_id]
        
        # Get user review for this book
        if user_id in user_reviews and volume_id in user_reviews[user_id]:
            if "userInfo" not in data:
                data["userInfo"] = {}
            data["userInfo"]["review"] = user_reviews[user_id][volume_id]
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# CRUD operations for favorites
@app.route("/api/favorites", methods=["GET"])
def get_favorites():
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_favorites:
        return jsonify({"items": []})
    
    favorites_list = []
    for book_id in user_favorites[user_id]:
        book_info = user_favorites[user_id][book_id]
        favorites_list.append({
            "id": book_id,
            "addedAt": book_info["addedAt"],
            "volumeInfo": book_info["volumeInfo"]
        })
    
    return jsonify({"items": favorites_list})

@app.route("/api/favorites", methods=["POST"])
def add_favorite():
    data = request.json
    user_id = data.get("user_id", "anonymous")
    book_id = data.get("book_id")
    book_info = data.get("bookInfo", {})
    
    if not book_id:
        return jsonify({"error": "Book ID is required"}), 400
    
    if user_id not in user_favorites:
        user_favorites[user_id] = {}
    
    user_favorites[user_id][book_id] = {
        "addedAt": datetime.now().isoformat(),
        "volumeInfo": book_info
    }
    
    return jsonify({"success": True, "message": "Book added to favorites"})

@app.route("/api/favorites/<book_id>", methods=["DELETE"])
def remove_favorite(book_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_favorites or book_id not in user_favorites[user_id]:
        return jsonify({"error": "Book not found in favorites"}), 404
    
    del user_favorites[user_id][book_id]
    
    return jsonify({"success": True, "message": "Book removed from favorites"})

# CRUD operations for reading list
@app.route("/api/reading-list", methods=["GET"])
def get_reading_list():
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_reading_list:
        return jsonify({"items": []})
    
    reading_list = []
    for book_id in user_reading_list[user_id]:
        book_info = user_reading_list[user_id][book_id]
        reading_list.append({
            "id": book_id,
            "addedAt": book_info["addedAt"],
            "status": book_info["status"],
            "progress": book_info.get("progress", 0),
            "volumeInfo": book_info["volumeInfo"]
        })
    
    return jsonify({"items": reading_list})

@app.route("/api/reading-list", methods=["POST"])
def add_to_reading_list():
    data = request.json
    user_id = data.get("user_id", "anonymous")
    book_id = data.get("book_id")
    book_info = data.get("bookInfo", {})
    status = data.get("status", "to-read")  # to-read, reading, finished
    
    if not book_id:
        return jsonify({"error": "Book ID is required"}), 400
    
    if user_id not in user_reading_list:
        user_reading_list[user_id] = {}
    
    user_reading_list[user_id][book_id] = {
        "addedAt": datetime.now().isoformat(),
        "status": status,
        "progress": 0,
        "volumeInfo": book_info
    }
    
    return jsonify({"success": True, "message": "Book added to reading list"})

@app.route("/api/reading-list/<book_id>", methods=["PUT"])
def update_reading_status(book_id):
    data = request.json
    user_id = data.get("user_id", "anonymous")
    status = data.get("status")
    progress = data.get("progress")
    
    if user_id not in user_reading_list or book_id not in user_reading_list[user_id]:
        return jsonify({"error": "Book not found in reading list"}), 404
    
    if status:
        user_reading_list[user_id][book_id]["status"] = status
    
    if progress is not None:
        user_reading_list[user_id][book_id]["progress"] = progress
    
    return jsonify({"success": True, "message": "Reading status updated"})

@app.route("/api/reading-list/<book_id>", methods=["DELETE"])
def remove_from_reading_list(book_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_reading_list or book_id not in user_reading_list[user_id]:
        return jsonify({"error": "Book not found in reading list"}), 404
    
    del user_reading_list[user_id][book_id]
    
    return jsonify({"success": True, "message": "Book removed from reading list"})

# Book notes operations
@app.route("/api/notes/<book_id>", methods=["GET"])
def get_notes(book_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_notes or book_id not in user_notes[user_id]:
        return jsonify({"notes": []})
    
    return jsonify({"notes": user_notes[user_id][book_id]})

@app.route("/api/notes/<book_id>", methods=["POST"])
def add_note(book_id):
    data = request.json
    user_id = data.get("user_id", "anonymous")
    note_text = data.get("text", "")
    
    if not note_text:
        return jsonify({"error": "Note text is required"}), 400
    
    if user_id not in user_notes:
        user_notes[user_id] = {}
    
    if book_id not in user_notes[user_id]:
        user_notes[user_id][book_id] = []
    
    note_id = str(uuid.uuid4())
    new_note = {
        "id": note_id,
        "text": note_text,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    
    user_notes[user_id][book_id].append(new_note)
    
    return jsonify({"success": True, "note": new_note})

@app.route("/api/notes/<book_id>/<note_id>", methods=["PUT"])
def update_note(book_id, note_id):
    data = request.json
    user_id = data.get("user_id", "anonymous")
    note_text = data.get("text", "")
    
    if not note_text:
        return jsonify({"error": "Note text is required"}), 400
    
    if (user_id not in user_notes or 
        book_id not in user_notes[user_id]):
        return jsonify({"error": "Note not found"}), 404
    
    note_found = False
    for note in user_notes[user_id][book_id]:
        if note["id"] == note_id:
            note["text"] = note_text
            note["updatedAt"] = datetime.now().isoformat()
            note_found = True
            break
    
    if not note_found:
        return jsonify({"error": "Note not found"}), 404
    
    return jsonify({"success": True, "message": "Note updated"})

@app.route("/api/notes/<book_id>/<note_id>", methods=["DELETE"])
def delete_note(book_id, note_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if (user_id not in user_notes or 
        book_id not in user_notes[user_id]):
        return jsonify({"error": "Note not found"}), 404
    
    user_notes[user_id][book_id] = [
        note for note in user_notes[user_id][book_id] 
        if note["id"] != note_id
    ]
    
    return jsonify({"success": True, "message": "Note deleted"})

# Book reviews operations
@app.route("/api/reviews/<book_id>", methods=["GET"])
def get_review(book_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_reviews or book_id not in user_reviews[user_id]:
        return jsonify({"review": None})
    
    return jsonify({"review": user_reviews[user_id][book_id]})

@app.route("/api/reviews/<book_id>", methods=["POST", "PUT"])
def add_or_update_review(book_id):
    data = request.json
    user_id = data.get("user_id", "anonymous")
    rating = data.get("rating")
    review_text = data.get("text", "")
    
    if rating is None:
        return jsonify({"error": "Rating is required"}), 400
    
    if user_id not in user_reviews:
        user_reviews[user_id] = {}
    
    is_new = book_id not in user_reviews[user_id]
    
    user_reviews[user_id][book_id] = {
        "rating": rating,
        "text": review_text,
        "createdAt": datetime.now().isoformat() if is_new else user_reviews[user_id][book_id].get("createdAt"),
        "updatedAt": datetime.now().isoformat()
    }
    
    return jsonify({
        "success": True, 
        "message": "Review added" if is_new else "Review updated",
        "review": user_reviews[user_id][book_id]
    })

@app.route("/api/reviews/<book_id>", methods=["DELETE"])
def delete_review(book_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_reviews or book_id not in user_reviews[user_id]:
        return jsonify({"error": "Review not found"}), 404
    
    del user_reviews[user_id][book_id]
    
    return jsonify({"success": True, "message": "Review deleted"})

# Bookshelf operations
@app.route("/api/bookshelves", methods=["GET"])
def get_bookshelves():
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_book_shelf:
        # Create default bookshelves
        user_book_shelf[user_id] = {
            "0": {"name": "Favorites", "books": {}},
            "1": {"name": "Purchased", "books": {}},
            "2": {"name": "To Read", "books": {}},
            "3": {"name": "Reading Now", "books": {}},
            "4": {"name": "Have Read", "books": {}}
        }
    
    shelves = []
    for shelf_id, shelf_info in user_book_shelf[user_id].items():
        shelves.append({
            "id": shelf_id,
            "name": shelf_info["name"],
            "bookCount": len(shelf_info["books"])
        })
    
    return jsonify({"shelves": shelves})

@app.route("/api/bookshelves", methods=["POST"])
def create_bookshelf():
    data = request.json
    user_id = data.get("user_id", "anonymous")
    shelf_name = data.get("name")
    
    if not shelf_name:
        return jsonify({"error": "Shelf name is required"}), 400
    
    if user_id not in user_book_shelf:
        user_book_shelf[user_id] = {
            "0": {"name": "Favorites", "books": {}},
            "1": {"name": "Purchased", "books": {}},
            "2": {"name": "To Read", "books": {}},
            "3": {"name": "Reading Now", "books": {}},
            "4": {"name": "Have Read", "books": {}}
        }
    
    # Find the next available ID (greater than 1000 for custom shelves)
    max_id = 1000
    for shelf_id in user_book_shelf[user_id]:
        if shelf_id.isdigit() and int(shelf_id) >= 1000:
            max_id = max(max_id, int(shelf_id))
    
    new_id = str(max_id + 1)
    
    user_book_shelf[user_id][new_id] = {
        "name": shelf_name,
        "books": {}
    }
    
    return jsonify({
        "success": True,
        "shelf": {
            "id": new_id,
            "name": shelf_name,
            "bookCount": 0
        }
    })

@app.route("/api/bookshelves/<shelf_id>", methods=["PUT"])
def update_bookshelf(shelf_id):
    data = request.json
    user_id = data.get("user_id", "anonymous")
    shelf_name = data.get("name")
    
    if not shelf_name:
        return jsonify({"error": "Shelf name is required"}), 400
    
    if user_id not in user_book_shelf or shelf_id not in user_book_shelf[user_id]:
        return jsonify({"error": "Bookshelf not found"}), 404
    
    # Don't allow renaming default shelves
    if int(shelf_id) < 1000:
        return jsonify({"error": "Cannot rename default bookshelves"}), 403
    
    user_book_shelf[user_id][shelf_id]["name"] = shelf_name
    
    return jsonify({
        "success": True,
        "message": "Bookshelf updated"
    })

@app.route("/api/bookshelves/<shelf_id>", methods=["DELETE"])
def delete_bookshelf(shelf_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_book_shelf or shelf_id not in user_book_shelf[user_id]:
        return jsonify({"error": "Bookshelf not found"}), 404
    
    # Don't allow deleting default shelves
    if int(shelf_id) < 1000:
        return jsonify({"error": "Cannot delete default bookshelves"}), 403
    
    del user_book_shelf[user_id][shelf_id]
    
    return jsonify({
        "success": True,
        "message": "Bookshelf deleted"
    })

@app.route("/api/bookshelves/<shelf_id>/books", methods=["GET"])
def get_shelf_books(shelf_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_book_shelf or shelf_id not in user_book_shelf[user_id]:
        return jsonify({"error": "Bookshelf not found"}), 404
    
    books = []
    for book_id, book_info in user_book_shelf[user_id][shelf_id]["books"].items():
        books.append({
            "id": book_id,
            "addedAt": book_info["addedAt"],
            "volumeInfo": book_info["volumeInfo"]
        })
    
    return jsonify({
        "shelf": {
            "id": shelf_id,
            "name": user_book_shelf[user_id][shelf_id]["name"]
        },
        "books": books
    })

@app.route("/api/bookshelves/<shelf_id>/books", methods=["POST"])
def add_book_to_shelf(shelf_id):
    data = request.json
    user_id = data.get("user_id", "anonymous")
    book_id = data.get("book_id")
    book_info = data.get("bookInfo", {})
    
    if not book_id:
        return jsonify({"error": "Book ID is required"}), 400
    
    if user_id not in user_book_shelf or shelf_id not in user_book_shelf[user_id]:
        return jsonify({"error": "Bookshelf not found"}), 404
    
    user_book_shelf[user_id][shelf_id]["books"][book_id] = {
        "addedAt": datetime.now().isoformat(),
        "volumeInfo": book_info
    }
    
    return jsonify({
        "success": True,
        "message": "Book added to shelf"
    })

@app.route("/api/bookshelves/<shelf_id>/books/<book_id>", methods=["DELETE"])
def remove_book_from_shelf(shelf_id, book_id):
    user_id = request.args.get("user_id", "anonymous")
    
    if user_id not in user_book_shelf or shelf_id not in user_book_shelf[user_id]:
        return jsonify({"error": "Bookshelf not found"}), 404
    
    if book_id not in user_book_shelf[user_id][shelf_id]["books"]:
        return jsonify({"error": "Book not found in shelf"}), 404
    
    del user_book_shelf[user_id][shelf_id]["books"][book_id]
    
    return jsonify({
        "success": True,
        "message": "Book removed from shelf"
    })

@app.route("/api/health")
def health_check():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True)
