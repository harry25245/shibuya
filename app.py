
from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# Load the summarization pipeline once at startup
summarizer = pipeline('summarization', model='facebook/bart-large-cnn')

# Helper function to chunk long texts
def chunk_text(text, max_tokens=900):
    import re
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = []
    current = ''
    for sentence in sentences:
        if len((current + ' ' + sentence).split()) > max_tokens:
            if current:
                chunks.append(current.strip())
                current = sentence
            else:
                chunks.append(sentence.strip())
                current = ''
        else:
            current += ' ' + sentence
    if current.strip():
        chunks.append(current.strip())
    return chunks

@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.get_json()
    text = data.get('text', '')
    if not text.strip():
        return jsonify({'summary': 'No text provided.'}), 400

    try:
        # Chunk the text if it's too long
        chunks = chunk_text(text, max_tokens=900)
        summaries = []
        for chunk in chunks:
            s = summarizer(chunk, max_length=130, min_length=30, do_sample=False)[0]['summary_text']
            summaries.append(s)
        # If more than one chunk, summarize the summaries
        if len(summaries) > 1:
            final_summary = summarizer(' '.join(summaries), max_length=130, min_length=30, do_sample=False)[0]['summary_text']
        else:
            final_summary = summaries[0]
        return jsonify({'summary': final_summary})
    except Exception as e:
        import traceback
        error_message = f'{str(e)}\n{traceback.format_exc()}'
        print(error_message)
        return jsonify({'summary': f'Error: {error_message}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
