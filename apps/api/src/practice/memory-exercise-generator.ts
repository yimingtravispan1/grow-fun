import type { KnowledgeRetriever, PracticeExerciseGenerator } from "@growfun/domain";
import { buildExercise, selectApprovedPair } from "./exercise-generator-utils.js";

export function createMemoryExerciseGenerator(retriever: KnowledgeRetriever): PracticeExerciseGenerator {
  return {
    mode: "memory",
    async generate(request) {
      const matches = await retriever.search({
        childAgeBand: request.childAgeBand,
        goal: request.goal,
        limit: 5,
      });
      const pair = selectApprovedPair(matches);

      return buildExercise({
        request,
        pair,
        matches,
        source: "memory",
        modelVersion: null,
        copy: {
          title: `听清 ${pair.word} 和 ${pair.contrastWord}`,
          targetDescription: pair.knowledge.summary,
          speakingPrompt: `请用 ${pair.word} 和 ${pair.contrastWord} 说一句完整的话。`,
          suggestedSentence: `I can hear ${pair.word} and ${pair.contrastWord}.`,
        },
      });
    },
  };
}
