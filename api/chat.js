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

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Calling Gemini API...');

    // Call Gemini API
    const geminiResponse = await fetch(
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

    // Get the response text to see what Gemini is saying
    const responseText = await geminiResponse.text();
    console.log('Gemini response status:', geminiResponse.status);
    console.log('Gemini response:', responseText);

    if (!geminiResponse.ok) {
      console.error('Gemini API error - Status:', geminiResponse.status);
      console.error('Gemini API error - Body:', responseText);
      
      // Return the actual error to help debug
      return res.status(500).json({ 
        error: 'Gemini API request failed', 
        status: geminiResponse.status,
        details: responseText 
      });
    }

    const data = JSON.parse(responseText);
    console.log('Success! Returning response to client');
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Error in handler:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({ 
      error: 'Failed to get response', 
      message: error.message 
    });
  }
}