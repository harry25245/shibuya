from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Allow the frontend origin(s) to call the API. Change origins to your production URL when deployed.
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:8000", "http://127.0.0.1:8000"]}}, supports_credentials=True)

OPENROUTER_KEY = os.getenv('OPENROUTER_API_KEY', '').strip()

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        # Let flask_cors handle preflight, but keep this safe fallback
        return jsonify({}), 204

    if not OPENROUTER_KEY:
        return jsonify({"error": "Server missing OPENROUTER_API_KEY"}), 400

    data = request.json or {}
    message = data.get('message', '')
    payload = {
        "model": "deepseek/deepseek-chat",
        "messages": [{"role": "user", "content": f"Question: {message}\nAnswer:"}],
        "temperature": 0.7,
        "max_tokens": 512
    }
    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"}
    try:
        r = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers, timeout=30)
        return jsonify(r.json()), r.status_code
    except requests.RequestException as e:
        return jsonify({"error": f"Request failed: {e}"}), 502

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
