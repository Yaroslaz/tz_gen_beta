export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get credentials from environment variables
    const API_KEY = process.env.YANDEX_API_KEY;
    const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

    if (!API_KEY || !FOLDER_ID) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Make request to YandexGPT API
    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${API_KEY}`,
        'x-folder-id': FOLDER_ID,
      },
      body: JSON.stringify({
        modelUri: `gpt://${FOLDER_ID}/yandexgpt-lite`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: '2000',
        },
        messages: [
          {
            role: 'system',
            'text': 'Ты помощник для создания технического задания. Задавай ПРОСТЫЕ вопросы обычному заказчику. Правила: 1) Говори как с другом, без специальных терминов 2) Один вопрос за раз 3) Спрашивай: что нужно, для кого, когда 4) Избегай слов: архитектура, API, стек, фреймворк. Вместо "Какая архитектура нужна?" спроси "Где и как это будет работать?"',
          },
          {
            role: 'user',
            text: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YandexGPT API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `YandexGPT API error: ${response.status}` 
      });
    }

    const data = await response.json();

    // Extract text from YandexGPT response
    const text = data?.result?.alternatives?.[0]?.message?.text;

    if (!text) {
      console.error('Unexpected API response structure:', data);
      return res.status(500).json({ error: 'Unexpected API response' });
    }

    return res.status(200).json({ text });

  } catch (error) {
    console.error('Error in enhance handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
