import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Basic Express server that proxies chat to Groq
const app = express();
const PORT = process.env.PORT || 3000;
const HALO_MODEL = 'openai/gpt-oss-20b'; // Requested model (will fallback if not available on Groq)

// Groq models - these are all free
const FREE_MODELS = [
  'openai/gpt-oss-20b',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant', 
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768'
];

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'HALO Universe', version: 'v1', provider: 'Groq', model: HALO_MODEL });
});

// Simple in-memory "stop" flags per channel
const stopFlags = new Map();

app.post('/chat/stop', (req, res) => {
  const { channelId } = req.body || {};
  if (channelId) stopFlags.set(channelId, true);
  res.json({ stopped: true });
});

// Proxy endpoint for Tavily search so frontend can fetch results via backend (keeps API key server-side)
app.post('/search/tavily', async (req, res) => {
  const { query, limit = 5 } = req.body || {};
  if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Missing query' });
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) return res.status(500).json({ error: 'TAVILY_API_KEY not set on server' });

  const TAVILY_BASE = process.env.TAVILY_BASE_URL || 'https://api.tavily.com';
  const url = `${TAVILY_BASE.replace(/\/$/, '')}/search`;

  try {
    const tavilyResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tavilyApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        max_results: limit,
        search_depth: "basic"
      })
    });

    const bodyText = await tavilyResp.text().catch(()=> '');
    if (!tavilyResp.ok) {
      console.warn(`Tavily API error ${tavilyResp.status} when calling ${url}`, bodyText);
      return res.status(tavilyResp.status).json({ error: 'Tavily API error', status: tavilyResp.status, url, body: tryParse(bodyText) });
    }

    try { return res.status(200).json(JSON.parse(bodyText)) } catch { return res.status(200).send(bodyText) }
  } catch (e) {
    console.warn('Tavily proxy error', e);
    return res.status(500).json({ error: 'Tavily proxy error', details: String(e) });
  }
})

function tryParse(text){
  try{ return JSON.parse(text) }catch{return text}
}

// Chat message -> forwards to Groq and returns reply (non-streaming)
app.post('/chat/message', async (req, res) => {
  const { text, userId, channelId, haloThink, webSearch, tavilyResults } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text' });
  }

  stopFlags.set(channelId || 'default', false);

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY not set' });
    }

    // Build Groq request
    const primaryModel = haloThink ? 'openai/gpt-oss-120b' : HALO_MODEL;

    // Heuristic for simple vs complex prompts
    const totalChars = String(text || '').replace(/\s+/g, '').length;
    const lines = String(text || '').split('\n').length;

    const isSuperShort = totalChars <= 10; 
    const isSimple = totalChars > 0 && totalChars <= 120 && lines <= 2;

    // Base system prompt
    const baseSystem = `You are HALO AI, a playful, creative, and intelligent assistant.
Always reply in a friendly, concise way with natural emojis 🎉.
Keep answers short unless the user explicitly asks for detail.`;

    const formattingExtra = `\n\n### Formatting Rules:
- Add a **title/heading** only for complex outputs, separated with a horizontal line (---).
- Use **bold text** and emojis for section headers when appropriate.
- Write in clear paragraphs, never a single block of text.
- Use **lists** when explaining step-by-step content.
- For stories, poems, or creative writing:
  - Begin with a **story title** styled with emoji + bold text.
  - Keep paragraphs short, descriptive, and dramatic.
  - End with a reflection, suspense, or a question if fitting.
- For code:
  - Always wrap in proper code blocks with language specified.
  - Include comments for clarity.`;

    let systemPrompt;
    if (isSuperShort && !webSearch) {
      systemPrompt = `You are HALO AI. The user just greeted you with something very short like "Hi". 
Reply with a single friendly one-liner and one emoji.`;
    } else {
      systemPrompt = (isSimple && !haloThink && !webSearch) ? baseSystem : baseSystem + formattingExtra;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    // Always honor webSearch request
    if (webSearch) {
      try {
        const tavilyApiKey = process.env.TAVILY_API_KEY;
        if (!tavilyApiKey) {
          console.warn('Web search requested but TAVILY_API_KEY not set');
        } else {
          const tavilyResp = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tavilyApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: text,
              max_results: 5,
              search_depth: "basic"
            })
          });

          if (tavilyResp.ok) {
            const tavilyJson = await tavilyResp.json().catch(()=> null);
            let summary = '';
            if (tavilyJson && Array.isArray(tavilyJson.results)) {
              summary = tavilyJson.results.slice(0,5).map((r, i) => `(${i+1}) ${r.title || r.snippet || r.url || ''}`).join('\n');
            } else if (tavilyJson && typeof tavilyJson.summary === 'string') {
              summary = String(tavilyJson.summary);
            }
            if (summary) {
              messages.push({ role: 'system', content: `Web search results (from Tavily):\n${summary}` });
            }
          } else {
            const body = await tavilyResp.text().catch(()=> '')
            console.warn('Tavily API error', tavilyResp.status, body)
          }
        }
      } catch (e) {
        console.warn('Error calling Tavily', e)
      }
    } else if (tavilyResults) {
      try {
        let summary = '';
        if (Array.isArray(tavilyResults)) {
          summary = tavilyResults.slice(0,5).map((r, i) => `(${i+1}) ${r.title || r.snippet || r.url || JSON.stringify(r)}`).join('\n');
        } else if (typeof tavilyResults === 'string') {
          summary = tavilyResults;
        } else if (tavilyResults && typeof tavilyResults === 'object' && Array.isArray(tavilyResults.results)) {
          summary = tavilyResults.results.slice(0,5).map((r, i) => `(${i+1}) ${r.title || r.snippet || r.url || ''}`).join('\n');
        }
        if (summary) messages.push({ role: 'system', content: `Web search results (from Tavily):\n${summary}` });
      } catch (e) {
        console.warn('Error processing tavilyResults', e)
      }
    }

    // Add the user's message
    messages.push({ role: 'user', content: text });

    async function callModel(model) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          temperature: 0.7,
          max_tokens: 2048
        })
      });
    }

    // Try primary model first, then fallback
    let usedModel = primaryModel;
    let resp = await callModel(primaryModel);

    if (!resp.ok) {
      console.log(`Primary model ${primaryModel} failed with ${resp.status}, trying fallbacks...`);
      for (const fallbackModel of FREE_MODELS) {
        if (fallbackModel === primaryModel) continue;
        console.log(`Trying fallback model: ${fallbackModel}`);
        usedModel = fallbackModel;
        resp = await callModel(fallbackModel);
        if (resp.ok) break;
      }
    }

    if (!resp.ok) {
      const bodyText = await resp.text();
      return res.status(resp.status === 402 ? 402 : 502).json({
        error: 'Groq API error',
        reason:
          resp.status === 402 || /insufficient balance/i.test(bodyText)
            ? 'Rate limit or quota exceeded on Groq.'
            : resp.status === 401
            ? 'Authentication issue with Groq API - check GROQ_API_KEY.'
            : 'Upstream error from Groq.',
        model: usedModel,
        details: bodyText
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';

    res.json({ reply: content, model: usedModel, userId, channelId });
  } catch (err) {
    console.error('Chat error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`HALO backend listening on http://localhost:${PORT}`);
  console.log(`Primary model: ${HALO_MODEL} (Groq)`);
});
