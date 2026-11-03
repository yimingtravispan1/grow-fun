import type { KnowledgeMatch, KnowledgeRetriever } from "@growfun/domain";
import OpenAI from "openai";

export function createOpenAiVectorStoreRetriever(vectorStoreId: string): KnowledgeRetriever {
  const client = new OpenAI();

  return {
    async search(input) {
      const page = await client.vectorStores.search(vectorStoreId, {
        query: `${input.goal}; learner age: ${input.childAgeBand}`,
        max_num_results: Math.min(5, Math.max(1, input.limit ?? 3)),
        rewrite_query: true,
      });

      return page.data.map((result): KnowledgeMatch => {
        const attributes = result.attributes ?? {};
        const content = result.content
          .map((part) => (part.type === "text" ? part.text : ""))
          .filter(Boolean)
          .join("\n");

        return {
          knowledgeId: result.file_id,
          title: String(attributes.title ?? result.filename),
          summary: String(attributes.summary ?? content.slice(0, 180)),
          sourceTitle: String(attributes.sourceTitle ?? result.filename),
          sourceUrl: String(attributes.sourceUrl ?? "https://www.internationalphoneticassociation.org/content/ipa-chart"),
          score: result.score,
          content,
          keywords: [],
          examples: [],
        };
      });
    },
  };
}
