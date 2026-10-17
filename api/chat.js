// Vercel serverless endpoint for the Vertechions website chatbot.
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Chatbot configuration error: GEMINI_API_KEY is missing.');
    return res.status(500).json({ error: 'The chatbot is not configured yet.' });
  }

  const userMessage = typeof req.body?.userMessage === 'string' ? req.body.userMessage.trim() : '';
  if (!userMessage) {
    return res.status(400).json({ error: 'Please enter a message.' });
  }
  if (userMessage.length > 2000) {
    return res.status(400).json({ error: 'Please keep your message under 2,000 characters.' });
  }

  const systemInstruction = `You are the website assistant for Vertechions, a small business focused on business VoIP phone systems in Banting and nearby Selangor, Malaysia.

BUSINESS AND SERVICES
- Help small businesses plan and set up IP desk phones and PBX phone systems.
- Supply compatible IP phones and PBX equipment by order after the customer's requirements and quotation are agreed. Do not claim that equipment is held in stock.
- Installation, deployment, extension setup, call routing, device configuration, testing, and user handover.
- Troubleshooting existing VoIP systems, call failures, audio problems, configuration issues, and ongoing technical support.
- Vertechions also has hands-on SIP/RTP troubleshooting experience, which can support deeper investigations when needed.
- Potential technical subcontracting and project support for IT companies and system integrators may be discussed.

SERVICE AREA AND CONTACT
- Primary area: Banting and nearby Selangor, Malaysia. Confirm travel or remote-support suitability for each request; do not claim nationwide on-site coverage.
- Email: hello@vertechions.com
- Website: https://vertechions.com/
- Do not invent prices, supplier relationships, product brands, stock availability, certifications, response times, or guarantees.
- If asked for a price, explain that a quote depends on user/extension count, requirements, equipment and site needs. Ask them to use the website contact form or email hello@vertechions.com.
- Do not claim 24/7 availability.
- Be friendly, concise, professional, and practical. Usually answer in 2–4 sentences.
- If a request is outside the stated services or you are unsure, say so clearly and suggest contacting hello@vertechions.com.
- Never ask users to share passwords, API keys, credentials, private configuration secrets, or confidential customer data.
- Do not claim you have booked, ordered, diagnosed, or contacted anyone. You are an informational website assistant.`;

  try {
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: userMessage }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 500
          }
        })
      }
    );

    const data = await geminiResponse.json().catch(() => ({}));
    if (!geminiResponse.ok) {
      console.error('Gemini API request failed:', geminiResponse.status, data?.error?.message || 'No error details');
      return res.status(502).json({
        error: 'The AI service could not respond right now. Please try again shortly.'
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('')
      .trim();

    if (!reply) {
      console.error('Gemini returned no text response.');
      return res.status(502).json({
        error: 'The AI service returned an empty response. Please try again.'
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chatbot server error:', error?.message || error);
    return res.status(500).json({
      error: 'The chatbot could not connect right now. Please try again or email hello@vertechions.com.'
    });
  }
}
