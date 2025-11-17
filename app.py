from flask import Flask, request, jsonify, send_from_directory # send_from_directory is critical
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

load_dotenv()

# --- CRITICAL FIX: Configure Flask to serve files from the 'public' folder ---
# 1. Sets the Flask app to look for static files inside the 'public' folder.
# 2. Sets the static URL path to '' so files are accessed directly (e.g., /style.css).
app = Flask(__name__, static_folder='public', static_url_path='') 
# ----------------------------------------------------------------------------

# Allow the frontend origin(s) to call the API.
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:8000", "http://127.0.0.1:8000"]}}, supports_credentials=True)

OPENROUTER_KEY = os.getenv('OPENROUTER_API_KEY', '').strip()

# --- NEW ROUTE: Serve the Main Page ---
@app.route('/')
def serve_index():
    """Serves the main index.html file from the 'public' folder."""
    return send_from_directory(app.static_folder, 'index.html')

# --- NEW ROUTE: Serve Static Assets (CSS, JS, etc.) ---
@app.route('/<path:filename>')
def serve_static_files(filename):
    """Serves static files (like style.css or script.js) directly from the public folder."""
    return send_from_directory(app.static_folder, filename)
# -------------------------------------

# --- API Route (Your Chat Logic) ---
@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({}), 204

    if not OPENROUTER_KEY:
        return jsonify({"error": "Server missing OPENROUTER_API_KEY"}), 500

    data = request.json or {}
    message = data.get('message', '')
    profile = data.get('profile', 'general') 

    payload = {
        "model": "deepseek/deepseek-chat",
        # Including the profile in the instruction
        "messages": [{"role": "user", "content": f"You are a helpful AI assistant. Respond as a {profile} profile. Question: {message}"}],
        "temperature": 0.7,
        "max_tokens": 512
    }
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}", 
        "Content-Type": "application/json"
    }
    
    response = None
    try:
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=30 
        )
        
        response.raise_for_status() 

        ai_response = response.json()
        content = ai_response['choices'][0]['message']['content']
        
        return jsonify({"success": True, "answer": content})
    
    except requests.exceptions.RequestException as e:
        error_message = f"API request failed: {e}"
        if response is not None:
            error_message = f"API request failed: {response.status_code} {response.reason} for URL: {response.url}"
            status_code = response.status_code
        else:
            status_code = 500
        
        print(f"ERROR: {error_message}")
        return jsonify({"success": False, "error": error_message}), status_code

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
