// api/chat.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage, context } = req.body;

    // Call Gemini API with the secret key from environment variable
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${context}\n\nUser question: ${userMessage}\n\nProvide a helpful, concise response:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to get response' });
  }
}