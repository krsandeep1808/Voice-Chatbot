export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    // Validate request body
    if (!req.body || !req.body.message) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Missing "message" in request body'
      });
    }

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that responds concisely in a friendly tone."
          },
          {
            role: "user",
            content: req.body.message
          }
        ],
        temperature: 0.7
      })
    });

    // Handle OpenAI API errors
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return res.status(502).json({
        error: 'Bad gateway',
        message: errorData.error?.message || 'Error communicating with OpenAI'
      });
    }

    // Parse and return response
    const data = await openaiResponse.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Malformed response from OpenAI");
    }

    return res.status(200).json({ 
      reply: data.choices[0].message.content 
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}