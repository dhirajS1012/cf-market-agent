import { Hono } from "hono";
import { MarketAgent } from "./agent";

// Re-export Durable Object class (required by Cloudflare)
export { MarketAgent };

type Bindings = {
  AI: Ai;
  MARKET_AGENT: DurableObjectNamespace;
  SESSIONS: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// ── Health check ──────────────────────────────────────────
app.get("/api/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── Create session — returns a unique sessionId ───────────
app.post("/api/session", async (c) => {
  const sessionId = crypto.randomUUID();
  await c.env.SESSIONS.put(
    sessionId,
    JSON.stringify({ created: Date.now() }),
    { expirationTtl: 86400 }
  );
  return c.json({ sessionId });
});

// ── Chat endpoint — routes to Durable Object by sessionId ─
app.post("/api/chat", async (c) => {
  const body = await c.req.json<{ sessionId: string; message: string }>();
  const { sessionId, message } = body;

  if (!sessionId || !message) {
    return c.json({ error: "sessionId and message are required" }, 400);
  }

  // Get (or create) the Durable Object for this session
  const id = c.env.MARKET_AGENT.idFromName(sessionId);
  const stub = c.env.MARKET_AGENT.get(id);

  // Forward the chat request to the Durable Object
  const doResponse = await stub.fetch(
    new Request("https://internal/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
  );

  const data = await doResponse.json<{ response?: string; error?: string }>();

  if (data.error) {
    return c.json({ error: data.error }, 500);
  }

  return c.json({ response: data.response, sessionId });
});

// ── Clear session history ─────────────────────────────────
app.delete("/api/session/:id", async (c) => {
  const sessionId = c.req.param("id");
  const id = c.env.MARKET_AGENT.idFromName(sessionId);
  const stub = c.env.MARKET_AGENT.get(id);

  await stub.fetch(
    new Request("https://internal/clear", { method: "DELETE" })
  );

  return c.json({ cleared: true, sessionId });
});

export default app;