// MarketAgent — Durable Object with persistent state
// Stores conversation history per session, calls Workers AI (Llama 3.3)

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type Env = {
  AI: Ai;
};

const SYSTEM_PROMPT = `You are FinSight — a financial market intelligence assistant built on Cloudflare's edge network.

You specialize in:
- Analyzing company valuations, credit ratings, and market data (like CRISIL and S&P Global produce)
- Explaining financial concepts: M&A, equity, bonds, derivatives, risk models
- Helping users understand global market trends and economic indicators
- Answering questions about financial data pipelines, BI reporting, and analytics

Guidelines:
- Be concise, accurate, and professional
- When asked about specific stocks or real-time prices, clarify you don't have live data
- Always provide educational context around financial topics
- Remember previous messages in the conversation for context

You are running on Cloudflare's global edge network — distributed across 330+ cities worldwide.`;

export class MarketAgent implements DurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/chat") {
      try {
        const { message } = await request.json<{ message: string }>();
        if (!message) {
          return Response.json({ error: "message is required" }, { status: 400 });
        }
        const response = await this.handleChat(message);
        return Response.json({ response });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    if (request.method === "DELETE" && url.pathname === "/clear") {
      await this.state.storage.put("history", JSON.stringify([]));
      return Response.json({ cleared: true });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }

  private async getHistory(): Promise<Message[]> {
    // IMPORTANT: storage.get() is async — must be awaited
    const raw = await this.state.storage.get<string>("history");
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Message[];
    } catch {
      return [];
    }
  }

  private async saveHistory(history: Message[]): Promise<void> {
    const trimmed = history.slice(-20);
    await this.state.storage.put("history", JSON.stringify(trimmed));
  }

  private async handleChat(userMessage: string): Promise<string> {
    const history = await this.getHistory();

    const messages: Message[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userMessage },
    ];

    const result = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      } as Parameters<typeof this.env.AI.run>[1]
    );

    const assistantMessage =
      (result as { response?: string }).response ??
      "I couldn't generate a response. Please try again.";

    await this.saveHistory([
      ...history,
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantMessage },
    ]);

    return assistantMessage;
  }
}