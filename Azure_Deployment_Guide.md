# Azure App Service Deployment Guide (Node 20 LTS)

Here are the step-by-step changes made to configure your React application for a production-ready deployment on Azure App Service using the Node.js 20 LTS runtime stack.

## 1. Local Server Logic (`server.js`)
Azure's "Node" runtime stack expects a running Node.js process. We created an Express server to:
1.  Serve static files.
2.  **Proxy API calls to OpenAI** (to secure your API key).

**File:** `server.js`
```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Loads .env locally

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json()); // Allow parsing JSON bodies

// Secure API Endpoint
app.post('/api/chat', async (req, res) => {
  const { topic } = req.body;
  const apiKey = process.env.OPENAI_API_KEY; // Read from Azure App Settings

  if (!apiKey) return res.status(500).json({ error: 'Missing Server API Key' });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a curriculum designer." },
          { role: "user", content: `Create a curriculum for: "${topic}"...` },
        ],
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => console.log(`Server running on ${port}`));
```

---

## 2. Frontend Updates (`App.jsx`)
We removed the direct OpenAI call and the exposure of `VITE_OPENAI_API_KEY`. The frontend now calls your own server.

```javascript
// Old: fetch("https://api.openai.com/v1/chat/completions", ...)
// New:
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ topic }),
});
```

---

## 3. Configuration (`package.json`)
*   **Start Script**: `"start": "node server.js"` (Azure default).
*   **Engine**: `"node": "20.x"`.
*   **Dependencies**: `express` (^4.21.2) and `dotenv`.

---

## 4. Environment Variables
*   **Local**: Use `.env` with `OPENAI_API_KEY=...`.
*   **Azure**: Add `OPENAI_API_KEY` in **Settings -> Environment variables**.
    *   **CRITICAL**: Do *not* use `VITE_OPENAI_API_KEY`. That is only for build-time (insecure) usage.

---

## 5. Repository Setup
*   Remote: `https://github.com/erinskieasy/curriculum-studio.git`
*   Branch: `main`

## Summary Checklist
- [x] `server.js` configured with `/api/chat` proxy.
- [x] Client-side API key usage removed.
- [x] `package.json` configured for Node 20.
- [x] Code pushed to `main`.
- [ ] **Action Required**: Rename Azure App Setting to `OPENAI_API_KEY`.
