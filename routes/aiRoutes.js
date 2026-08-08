const express = require('express');
const router = express.Router();

router.post('/test', async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'OpenAI API key is not configured.' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an AI prompt tester. Evaluate the prompt quality and suggest improvements.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 250,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ success: false, message: data.error?.message || 'OpenAI API error' });
    }

    const aiText = data.choices?.[0]?.message?.content || 'No response received.';
    res.json({ success: true, result: aiText });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
