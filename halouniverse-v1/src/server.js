import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const app = express();
const PORT = process.env.PORT || 3000;
const HALO_MODEL = 'openai/gpt-oss-20b';

// Groq free models
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

// Ensure uploads directory exists
const UPLOAD_DIR = path.resolve('./uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer setup for image uploads (memory storage so we can process with sharp)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads allowed'));
    cb(null, true);
  }
});

/* -------------------- Health -------------------- */
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'HALO Universe',
    version: 'v1',
    provider: 'Groq',
    model: 'HALO Universe v1 architecture'
  });
});

/* -------------------- Stop flags -------------------- */
const stopFlags = new Map();

app.post('/chat/stop', (req, res) => {
  const { channelId } = req.body || {};
  if (channelId) stopFlags.set(channelId, true);
  res.json({ stopped: true });
});

/* -------------------- Utilities -------------------- */
function nowIso() {
  return new Date().toISOString();
}

// Fixed HALO identity answers
const FIXED_MODEL = "HALO AI";

// Array of beautified architecture responses
const FIXED_ARCHITECTURE_LINES = [
  "HALO AI — powered by Web Search, Halo Think, and Voice Mode.",
  "The HALO Universe v1 Architecture: Web Search · Halo Think · Voice Mode.",
  "HALO Universe v1 Architecture — a fusion of Web Search, Halo Think, and Voice Mode.",
  "HALO Universe v1 = Web Search 🔍 + Halo Think 🧠 + Voice Mode 🎤 → your ultimate AI sidekick 🚀."
];

// Keep track of the current index
let archIndex = 0;

// Function to get next line in cycle
function getArchitectureLine() {
  const line = FIXED_ARCHITECTURE_LINES[archIndex];
  archIndex = (archIndex + 1) % FIXED_ARCHITECTURE_LINES.length; // cycle
  return line;
}

// Detect if user is asking about model/architecture
function checkIdentityIntent(text = '') {
  const q = text.toLowerCase();
  if (q.includes("which model") || /\bmodel\b/.test(q)) {
    return FIXED_MODEL;
  }
  if (q.includes("which architecture") || /\barchitecture\b/.test(q)) {
    return getArchitectureLine();
  }
  return null;
}

function buildStrictSystemPrompt({ baseOnly = false } = {}) {
  const baseSystem = `You are HALO AI, a concise, helpful assistant.
Current ISO time: ${nowIso()}.

### Identity
- You run on the **HALO Universe 1 architecture**.
- Your unique capabilities: Web Search, Halo Think, and Voice Mode for human-like conversations.
- Never mention Groq, OpenAI, GPT, or LLaMA.
  - If the user asks about your architecture or model, always answer with: 
  "${getArchitectureLine()}".
- Stay consistent — never reveal backend provider or model names.

Always be factual and avoid guessing. If you are unsure, say so briefly.`;

  const formattingExtra = `

### Rules (STRICT when web results are provided)
- Use ONLY the provided "Web search results" as facts.
- If the results are not sufficient or conflict, say: "I couldn't find a reliable answer from the results."
- Keep answers short and direct.`;

  return baseOnly ? baseSystem : baseSystem + formattingExtra;
}

// Remove backend leaks
function enforceHaloIdentity(reply) {
  if (!reply) return reply;
  return reply
    .replace(/gpt[\s-]*\d+/gi, 'HALO Universe 1 architecture')
    .replace(/llama[-\s]?\d*/gi, 'HALO Universe 1 architecture')
    .replace(/groq/gi, 'HALO Universe 1 architecture')
    .replace(/openai/gi, 'HALO Universe 1 architecture');
}

/* -------------------- Chat -------------------- */
app.post('/chat/message', async (req, res) => {
  const { text, userId, channelId, haloThink, webSearch, tavilyResults } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text' });
  }

  stopFlags.set(channelId || 'default', false);

  try {
    // 🔹 Check deterministic HALO intents first
    const fixedReply = checkIdentityIntent(text);
    if (fixedReply) {
      return res.json({ reply: fixedReply, model: 'HALO Identity', userId, channelId });
    }

    const apiKey = "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";
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY not set' });
    }

    const primaryModel = haloThink ? 'openai/gpt-oss-120b' : HALO_MODEL;

    const systemPrompt = buildStrictSystemPrompt({ baseOnly: !webSearch && !tavilyResults });

    let userContent = text;
    if (tavilyResults && tavilyResults.results) {
      const formattedResults = tavilyResults.results.map((result, index) => 
        `${index + 1}. **${result.title}**\n   ${result.content}\n   Source: ${result.url}`
      ).join('\n\n');
      userContent += `\n\nWeb search results:\n${formattedResults}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

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
          temperature: webSearch ? 0.2 : 0.7,
          max_tokens: 2048
        })
      });
    }

    let usedModel = primaryModel;
    let resp = await callModel(primaryModel);

    if (!resp.ok) {
      for (const fallbackModel of FREE_MODELS) {
        if (fallbackModel === primaryModel) continue;
        usedModel = fallbackModel;
        resp = await callModel(fallbackModel);
        if (resp.ok) break;
      }
    }

    if (!resp.ok) {
      const bodyText = await resp.text();
      return res.status(resp.status || 502).json({
        error: 'Groq API error',
        details: bodyText,
        model: usedModel
      });
    }

    const data = await resp.json();
    let content = data?.choices?.[0]?.message?.content || '';
    content = enforceHaloIdentity(content);

    res.json({ reply: content, model: 'HALO Universe 1 architecture', userId, channelId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* -------------------- Tavily Web Search -------------------- */
app.post('/search/tavily', async (req, res) => {
  const { query, limit = 5 } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing query' });
  }

  const TAVILY_API_KEY = "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";

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        max_results: limit,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavily API error response:', errorText);
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Tavily search error:', err);
    res.status(500).json({ error: 'Failed to perform web search' });
  }
});

/* -------------------- Visual Upload (image) -------------------- */
// Receives multipart/form-data with field 'image' and optional 'text' in body
app.post('/chat/visual', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const { originalname, buffer, mimetype, size } = req.file;
    const timestamp = Date.now();
    const filename = `${timestamp}-${originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const outPath = path.join(UPLOAD_DIR, filename);

    // Save original file
    await fs.promises.writeFile(outPath, buffer);

    // Use sharp to get metadata and produce a small thumbnail
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const thumbBuffer = await image.resize({ width: 512, height: 512, fit: 'inside' }).toBuffer();
    const thumbName = `thumb-${filename}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, thumbName), thumbBuffer);

    // Basic visual analysis placeholder: colors, dimensions, size
    const analysis = {
      filename,
      mime: mimetype,
      sizeBytes: size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasAlpha: !!metadata.hasAlpha,
    };

    // Optional text prompt from client to guide visual understanding
    const userText = req.body?.text || '';

    // Placeholder: here you would call an external vision model or run OCR,
    // object detection, etc. For now return metadata and a friendly summary.
    const visualReply = `I received your image (${analysis.width}x${analysis.height}, ${analysis.format}). ${userText ? 'You asked: ' + userText : ''}`;

    res.json({
      ok: true,
      analysis,
      reply: visualReply,
      files: {
        original: `/uploads/${filename}`,
        thumbnail: `/uploads/${thumbName}`
      }
    });
  } catch (err) {
    console.error('Visual upload error', err);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

/* -------------------- Start -------------------- */
app.listen(PORT, () => {
  console.log(`HALO backend listening on http://localhost:${PORT}`);
  console.log(`Primary model: HALO Universe 1 architecture`);
});
