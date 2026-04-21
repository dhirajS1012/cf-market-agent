# FinSight — Market Intelligence Agent

A financial market intelligence chatbot built on **Cloudflare's edge network** using the Agents SDK.

## Architecture

This project demonstrates core components:

| Component | Implementation |
|---|---|
| **LLM** | Llama 3.3 70B via Cloudflare Workers AI |
| **Workflow / Coordination** | Cloudflare Agents SDK + Hono router on Workers |
| **User Input** | Chat UI served via Cloudflare Pages |
| **Memory / State** | Durable Objects with SQLite — persists conversation history per session |

## Features

- 💬 Persistent chat sessions — conversation history stored in Durable Objects
- 🧠 Context-aware responses — last 20 messages kept in memory
- 📈 Financial domain expertise — specialized in credit ratings, market data, M&A, valuations
- 🌍 Edge-native — deployed across Cloudflare's global network
- ⚡ High performance — sub-100ms latency
- 🔄 Session management — create, chat, and clear sessions via REST API

## Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono (lightweight TypeScript web framework)
- **AI:** Cloudflare Workers AI — Llama 3.3 70B
- **State:** Durable Objects with SQLite
- **Session tracking:** Workers KV
- **Frontend:** Static HTML/CSS/JS on Cloudflare Pages
- **Language:** TypeScript

## Setup & Deploy

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Steps

```bash
# 1. Clone and install
git clone <your-repo-url>
cd cf-market-agent
npm install

# 2. Login to Cloudflare
npx wrangler login

# 3. Create KV namespace for sessions
npx wrangler kv:namespace create SESSIONS

# 4. Run locally
npm run dev

# 5. Deploy to Cloudflare
npm run deploy
```

### Local Development

```
npm run dev
```

Visit `http://localhost:8787` to use the chat interface locally.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/session` | Create new chat session |
| `POST` | `/api/chat` | Send message |
| `DELETE` | `/api/session/:id` | Clear session history |

## Project Structure

```
cf-market-agent/
├── index.ts          
├── agent.ts          
├── index.html        
├── wrangler.jsonc    
├── tsconfig.json
└── package.json
```

Previously built financial data systems for CRISIL–S&P Global, one of the world's largest credit ratings and global market data platforms. This project draws on that experience to create a domain-specialized AI agent for financial market intelligence.

Deployed on Cloudflare's global edge — the same infrastructure that powers 20% of the Internet.
