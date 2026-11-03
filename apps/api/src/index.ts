import { createOpenAiProvider } from "./ai/openai-provider.js";
import { createMemoryAiProvider } from "./ai/memory-provider.js";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { localKnowledgeRetriever } from "./knowledge/local-retriever.js";
import { createOpenAiVectorStoreRetriever } from "./knowledge/openai-vector-retriever.js";
import { memoryLanguageAssessmentProvider } from "./scoring/memory-language-provider.js";
import { createOpenAiLanguageAssessmentProvider } from "./scoring/openai-language-provider.js";
import { createScoringAgent } from "./scoring/scoring-agent.js";
import { createMemoryExerciseGenerator } from "./practice/memory-exercise-generator.js";
import { createOpenAiExerciseGenerator } from "./practice/openai-exercise-generator.js";
import { createOpenSourceExerciseGenerator } from "./practice/open-source-exercise-generator.js";
import { InMemoryLessonHistoryStore } from "./lesson/in-memory-lesson-history.js";
import { createLessonOrchestrator } from "./lesson/lesson-orchestrator.js";
import { createMemoryLessonAgent } from "./lesson/memory-lesson-agent.js";
import { createOpenAiLessonAgent } from "./lesson/openai-lesson-agent.js";
import { createOpenSourceLessonAgent } from "./lesson/open-source-lesson-agent.js";
import {
  createMemoryLessonReviewAgent,
  createOpenAiLessonReviewAgent,
  createOpenSourceLessonReviewAgent,
} from "./lesson/lesson-review-agents.js";

if (config.aiProvider === "openai" && !config.openAiModel) {
  throw new Error("OPENAI_MODEL must be set explicitly when AI_PROVIDER=openai");
}

const knowledgeRetriever =
  config.ragProvider === "openai"
    ? createOpenAiVectorStoreRetriever(config.openAiVectorStoreId as string)
    : localKnowledgeRetriever;

const aiProvider =
  config.aiProvider === "openai"
    ? createOpenAiProvider(config.openAiModel as string, knowledgeRetriever)
    : createMemoryAiProvider(knowledgeRetriever);

const languageAssessmentProvider =
  config.scoringProvider === "openai"
    ? createOpenAiLanguageAssessmentProvider(config.openAiScoringModel as string)
    : memoryLanguageAssessmentProvider;
const scoringAgent = createScoringAgent(languageAssessmentProvider);
const exerciseGenerator =
  config.exerciseProvider === "openai"
    ? createOpenAiExerciseGenerator(config.openAiExerciseModel as string, knowledgeRetriever)
    : config.exerciseProvider === "open_source"
      ? createOpenSourceExerciseGenerator({
          apiKey: config.openSourceLlmApiKey,
          baseURL: config.openSourceLlmBaseUrl as string,
          model: config.openSourceLlmModel as string,
          retriever: knowledgeRetriever,
          useJsonMode: config.openSourceLlmUseJsonMode,
        })
    : createMemoryExerciseGenerator(knowledgeRetriever);

const lessonGenerationAgent =
  config.lessonProvider === "openai"
    ? createOpenAiLessonAgent(config.openAiLessonModel as string)
    : config.lessonProvider === "open_source"
      ? createOpenSourceLessonAgent({
          apiKey: config.openSourceLlmApiKey,
          baseURL: config.openSourceLlmBaseUrl as string,
          model: config.openSourceLlmModel as string,
          useJsonMode: config.openSourceLlmUseJsonMode,
        })
      : createMemoryLessonAgent();

const lessonReviewAgent =
  config.lessonReviewProvider === "openai"
    ? createOpenAiLessonReviewAgent(config.openAiLessonReviewModel as string)
    : config.lessonReviewProvider === "open_source"
      ? createOpenSourceLessonReviewAgent({
          apiKey: config.openSourceLlmApiKey,
          baseURL: config.openSourceLlmBaseUrl as string,
          model: config.openSourceLlmModel as string,
          useJsonMode: config.openSourceLlmUseJsonMode,
        })
      : createMemoryLessonReviewAgent();

const lessonOrchestrator = createLessonOrchestrator({
  retriever: knowledgeRetriever,
  generationAgent: lessonGenerationAgent,
  reviewAgent: lessonReviewAgent,
  history: new InMemoryLessonHistoryStore(),
  reviewMode: config.lessonReviewMode,
});

const app = buildApp(aiProvider, knowledgeRetriever, scoringAgent, exerciseGenerator, lessonOrchestrator);

await app.listen({ port: config.port, host: "0.0.0.0" });
