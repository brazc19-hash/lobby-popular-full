/**
 * Testes unitários do Lobby Popular
 * Valida as principais regras de negócio e integrações com o servidor
 */
import { describe, it, expect, beforeAll } from "vitest";

const API_BASE = "http://127.0.0.1:3000/api/trpc";

async function trpcGet(path: string, input?: Record<string, unknown>) {
  const url = input
    ? `${API_BASE}/${path}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
    : `${API_BASE}/${path}`;
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`tRPC GET ${path} failed: ${res.status}`);
  const data = await res.json();
  return data?.result?.data?.json;
}

async function trpcPost(path: string, input: Record<string, unknown> = {}) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`tRPC POST ${path} failed: ${res.status} - ${text}`);
  }
  const data = await res.json();
  return data?.result?.data?.json;
}

describe("Lobby Popular — API Tests", () => {
  // ─── Health Check ─────────────────────────────────────────────────────────
  it("servidor responde ao health check", async () => {
    const res = await fetch("http://127.0.0.1:3000/api/health");
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  // ─── Constituição ─────────────────────────────────────────────────────────
  describe("Base Legal (Constituição)", () => {
    it("retorna lista de artigos constitucionais", async () => {
      const articles = await trpcGet("constitution.list");
      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThan(0);
    });

    it("artigos contêm campos obrigatórios", async () => {
      const articles = await trpcGet("constitution.list");
      const art = articles[0];
      expect(art).toHaveProperty("id");
      expect(art).toHaveProperty("articleNumber");
      expect(art).toHaveProperty("title");
      expect(art).toHaveProperty("summary");
    });

    it("busca por artigo específico funciona", async () => {
      const articles = await trpcGet("constitution.list", { search: "saúde" });
      expect(Array.isArray(articles)).toBe(true);
      // Deve retornar artigos relacionados à saúde
      const hasHealthArticle = articles.some((a: { title: string; summary: string }) =>
        a.title.toLowerCase().includes("saúde") ||
        a.summary.toLowerCase().includes("saúde")
      );
      expect(hasHealthArticle).toBe(true);
    });

    it("artigo Art. 196 (Saúde) existe na base", async () => {
      const articles = await trpcGet("constitution.list");
      const art196 = articles.find((a: { articleNumber: string }) =>
        a.articleNumber.includes("196")
      );
      expect(art196).toBeDefined();
    });

    it("artigo Art. 37 (Administração Pública) existe na base", async () => {
      const articles = await trpcGet("constitution.list");
      const art37 = articles.find((a: { articleNumber: string }) =>
        a.articleNumber.includes("37")
      );
      expect(art37).toBeDefined();
    });
  });

  // ─── Lobbies ──────────────────────────────────────────────────────────────
  describe("Lobbies", () => {
    it("retorna lista de lobbies", async () => {
      const lobbies = await trpcGet("lobbies.list");
      expect(Array.isArray(lobbies)).toBe(true);
      expect(lobbies.length).toBeGreaterThan(0);
    });

    it("lobbies contêm campos obrigatórios", async () => {
      const lobbies = await trpcGet("lobbies.list");
      const lobby = lobbies[0];
      expect(lobby).toHaveProperty("id");
      expect(lobby).toHaveProperty("title");
      expect(lobby).toHaveProperty("description");
      expect(lobby).toHaveProperty("category");
      expect(lobby).toHaveProperty("status");
      expect(lobby).toHaveProperty("constitutionArticleId");
    });

    it("existem lobbies nacionais e locais", async () => {
      const lobbies = await trpcGet("lobbies.list");
      const national = lobbies.filter((l: { category: string }) => l.category === "national");
      const local = lobbies.filter((l: { category: string }) => l.category === "local");
      expect(national.length).toBeGreaterThan(0);
      expect(local.length).toBeGreaterThan(0);
    });

    it("lobby local possui coordenadas geográficas", async () => {
      const lobbies = await trpcGet("lobbies.list");
      const localLobby = lobbies.find((l: { category: string }) => l.category === "local");
      expect(localLobby).toBeDefined();
      expect(localLobby.latitude).toBeDefined();
      expect(localLobby.longitude).toBeDefined();
    });

    it("filtro por categoria nacional funciona", async () => {
      const lobbies = await trpcGet("lobbies.list", { category: "national" });
      expect(Array.isArray(lobbies)).toBe(true);
      lobbies.forEach((l: { category: string }) => {
        expect(l.category).toBe("national");
      });
    });

    it("filtro por categoria local funciona", async () => {
      const lobbies = await trpcGet("lobbies.list", { category: "local" });
      expect(Array.isArray(lobbies)).toBe(true);
      lobbies.forEach((l: { category: string }) => {
        expect(l.category).toBe("local");
      });
    });

    it("lobby de licitações (Art. 37) existe", async () => {
      const lobbies = await trpcGet("lobbies.list");
      const licitacoes = lobbies.find((l: { title: string }) =>
        l.title.toLowerCase().includes("licitaç")
      );
      expect(licitacoes).toBeDefined();
    });

    it("lobby de saúde (Art. 196) existe", async () => {
      const lobbies = await trpcGet("lobbies.list");
      const saude = lobbies.find((l: { title: string }) =>
        l.title.toLowerCase().includes("saúde") ||
        l.title.toLowerCase().includes("sus")
      );
      expect(saude).toBeDefined();
    });

    it("lobby local de redutor de velocidade existe", async () => {
      const lobbies = await trpcGet("lobbies.list");
      const redutor = lobbies.find((l: { title: string }) =>
        l.title.toLowerCase().includes("redutor") ||
        l.title.toLowerCase().includes("velocidade")
      );
      expect(redutor).toBeDefined();
    });

    it("lobbies locais com coordenadas retorna dados geográficos", async () => {
      const localLobbies = await trpcGet("lobbies.localWithCoords");
      expect(Array.isArray(localLobbies)).toBe(true);
      expect(localLobbies.length).toBeGreaterThan(0);
      localLobbies.forEach((l: { latitude: string; longitude: string }) => {
        expect(l.latitude).toBeDefined();
        expect(l.longitude).toBeDefined();
      });
    });
  });

  // ─── Comunidades ──────────────────────────────────────────────────────────
  describe("Comunidades", () => {
    it("retorna lista de comunidades", async () => {
      const communities = await trpcGet("communities.list");
      expect(Array.isArray(communities)).toBe(true);
      expect(communities.length).toBeGreaterThan(0);
    });

    it("comunidades contêm campos obrigatórios", async () => {
      const communities = await trpcGet("communities.list");
      const community = communities[0];
      expect(community).toHaveProperty("id");
      expect(community).toHaveProperty("name");
      expect(community).toHaveProperty("description");
      expect(community).toHaveProperty("theme");
    });

    it("busca de comunidades funciona", async () => {
      const communities = await trpcGet("communities.list", { search: "saúde" });
      expect(Array.isArray(communities)).toBe(true);
    });
  });

  // ─── Notícias ─────────────────────────────────────────────────────────────
  describe("Notícias", () => {
    it("retorna lista de notícias", async () => {
      const news = await trpcGet("news.list");
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBeGreaterThan(0);
    });

    it("notícias contêm campos obrigatórios", async () => {
      const news = await trpcGet("news.list");
      const item = news[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("summary");
      expect(item).toHaveProperty("source");
      expect(item).toHaveProperty("category");
    });
  });

  // ─── Regra de Ouro (Base Legal) ───────────────────────────────────────────
  describe("Regra de Ouro — Todo lobby tem base legal", () => {
    it("todos os lobbies têm constitutionArticleId definido", async () => {
      const lobbies = await trpcGet("lobbies.list");
      lobbies.forEach((l: { constitutionArticleId: number | null; title: string }) => {
        expect(l.constitutionArticleId).not.toBeNull();
        expect(l.constitutionArticleId).toBeGreaterThan(0);
      });
    });

    it("artigo constitucional de cada lobby existe na base", async () => {
      const lobbies = await trpcGet("lobbies.list");
      const articles = await trpcGet("constitution.list");
      const articleIds = new Set(articles.map((a: { id: number }) => a.id));
      lobbies.forEach((l: { constitutionArticleId: number; title: string }) => {
        expect(articleIds.has(l.constitutionArticleId)).toBe(true);
      });
    });
  });
});
