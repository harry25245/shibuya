const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';

app.post('/api/chat', async (req, res) => {
  try {
    if (!OPENROUTER_KEY) {
      return res.status(400).json({ error: 'Server missing OPENROUTER_API_KEY' });
    }

    const { message, profile } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: `Question: ${message}\nAnswer:` }],
        temperature: 0.7,
        max_tokens: 512
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(502).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});