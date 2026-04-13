const API = process.env.REACT_APP_API_URL || "https://apexsignal-backend-production.up.railway.app";

async function req(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  // Prices
  getPrices: () => req("/api/prices"),
  getPrice: (ticker) => req(`/api/prices/${ticker}`),

  // Signals
  getSignals: (refresh = false) => req(`/api/signals${refresh ? "?refresh=1" : ""}`),

  // Sentiment
  getSentiment: (ticker) => req(`/api/sentiment${ticker ? "/" + ticker : ""}`),

  // Portfolio
  getPortfolio: () => req("/api/portfolio"),
  buy: (ticker, allocationPct, thesis) =>
    req("/api/portfolio/buy", {
      method: "POST",
      body: JSON.stringify({ ticker, allocationPct, thesis }),
    }),
  sell: (ticker, reason) =>
    req("/api/portfolio/sell", {
      method: "POST",
      body: JSON.stringify({ ticker, reason }),
    }),
  evaluate: () => req("/api/portfolio/evaluate", { method: "POST" }),

  // AI
  chat: (messages, system, max_tokens = 600) =>
    req("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages, system, max_tokens }),
    }),
  getRecommendations: () =>
    req("/api/recommendations", { method: "POST" }),
};
