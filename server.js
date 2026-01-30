import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// Handle API requests
app.post('/api/chat', async (req, res) => {
  try {
    const { topic } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing API key configuration on server.' });
    }

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: "You are a curriculum designer. Create a table of contents.",
          },
          {
            role: "user",
            content: `Create a curriculum table of contents for the topic: "${topic}". Provide 6-10 modules. Each module should include 2-4 lesson bullets. Keep it concise and imaginative.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(response.status).json({ error: `OpenAI error: ${details}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Handle SPA routing by sending index.html for all other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
