# HALO Universe v1 (Backend)

Express-based proxy to OpenRouter for the HALO frontend.

## Endpoints

- GET /health — basic health check
- POST /chat/message — body: { text: string, userId?: string, channelId?: string } -> { reply: string }
- POST /chat/stop — body: { channelId: string }

## Env

- GROQ_API_KEY — required (get free API key from https://console.groq.com/)
- PORT — default 3000

## Dev

- Ensure Node 18+
- Ensure the API key is set in your system environment variables.
- Install deps and start:

```
npm install
npm run dev
```

## Notes

- Currently returns a full reply (non-streaming). You can extend to SSE for token streaming if desired.
