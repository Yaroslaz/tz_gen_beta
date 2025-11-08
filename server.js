
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// API endpoint for YandexGPT
app.post('/api/enhance', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await axios.post(
      'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
      {
        modelUri: 'gpt://b1g4e3si99tr626qulh3/yandexgpt-lite',
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: '2000',
        },
        messages: [
          {
            role: 'system',
            text: 'Ты профессиональный помощник для создания технических заданий. Отвечай кратко, по делу и на русском языке.',
          },
          {
            role: 'user',
            text: prompt,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Api-Key ${process.env.YANDEX_API_KEY}',
          'x-folder-id': 'process.env.YANDEX_FOLDER_ID',
        },
      }
    );

    const text = response.data?.result?.alternatives?.[0]?.message?.text;

    if (!text) {
      return res.status(500).json({ error: 'Empty response from YandexGPT' });
    }

    res.json({ text });
  } catch (error) {
    console.error('YandexGPT Error:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  // Try different HTML file names
  const htmlFiles = ['index.html', 'index_fixed.html', 'index_working.html', 'index_with_server.html'];

  for (const file of htmlFiles) {
    try {
      const filePath = path.join(__dirname, file);
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    } catch (e) {
      // Continue to next file
    }
  }

  // If no HTML file found
  res.send('HTML file not found. Please rename one of your HTML files to index.html');
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📂 Current directory: ${__dirname}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});