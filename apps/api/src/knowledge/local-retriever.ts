import type { KnowledgeMatch, KnowledgeQuery, KnowledgeRetriever } from "@growfun/domain";
import { pronunciationKnowledge } from "./pronunciation-knowledge.js";

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function includesTerm(query: string, term: string) {
  const normalizedTerm = normalize(term);
  if (/^[a-z]+$/.test(normalizedTerm)) {
    return query.match(/[a-z]+/g)?.includes(normalizedTerm) ?? false;
  }
  return query.includes(normalizedTerm);
}

function scoreDocument(query: string, document: (typeof pronunciationKnowledge)[number], index: number) {
  let score = 0.05 + Math.max(0, 0.02 - index * 0.0005);

  for (const keyword of document.keywords) {
    if (includesTerm(query, keyword)) {
      score += keyword.length >= 4 ? 0.28 : 0.18;
    }
  }

  for (const example of document.examples) {
    if (includesTerm(query, example.word)) score += 0.35;
    if (example.contrastWord && includesTerm(query, example.contrastWord)) score += 0.35;
    if (includesTerm(query, example.ipa)) score += 0.35;
    if (example.contrastIpa && includesTerm(query, example.contrastIpa)) score += 0.35;
  }

  return Math.min(1, Number(score.toFixed(3)));
}

export const localKnowledgeRetriever: KnowledgeRetriever = {
  async search(input: KnowledgeQuery): Promise<KnowledgeMatch[]> {
    const query = normalize(`${input.goal} ${input.childAgeBand}`);
    const limit = Math.min(5, Math.max(1, input.limit ?? 3));

    const ranked = pronunciationKnowledge
      .map((item, index) => ({ ...item, score: scoreDocument(query, item, index) }))
      .sort((left, right) => right.score - left.score);

    const [top] = ranked;
    if (top && top.score >= 0.3 && top.examples.length > 0) {
      const methodSupport = ranked.filter((item) => item.examples.length === 0);
      return [top, ...methodSupport].slice(0, limit);
    }

    return ranked.slice(0, limit);
  },
};
