import { describe, expect, it } from "vitest";
import { memoryAiProvider } from "./ai/memory-provider.js";
import { buildApp } from "./app.js";
import { localKnowledgeRetriever } from "./knowledge/local-retriever.js";
import { demoExercise } from "./practice/demo-exercise.js";
import { createMemoryExerciseGenerator } from "./practice/memory-exercise-generator.js";
import { InMemoryLessonHistoryStore } from "./lesson/in-memory-lesson-history.js";
import { createLessonOrchestrator } from "./lesson/lesson-orchestrator.js";
import { createMemoryLessonAgent } from "./lesson/memory-lesson-agent.js";
import { createMemoryLessonReviewAgent } from "./lesson/lesson-review-agents.js";
import { memoryLanguageAssessmentProvider } from "./scoring/memory-language-provider.js";
import { createScoringAgent } from "./scoring/scoring-agent.js";

describe("API", () => {
  it("reports health", async () => {
    const app = buildApp(memoryAiProvider);
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    await app.close();
  });

  it("previews a journey without an external AI call", async () => {
    const app = buildApp(memoryAiProvider);
    const response = await app.inject({
      method: "POST",
      url: "/v1/journeys/preview",
      payload: {
        familyId: "family-test",
        childAgeBand: "provisional",
        goal: "辨别 ship 和 sheep",
        minutesAvailable: 10,
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().source).toBe("memory");
    expect(response.json().evidence[0].knowledgeId).toBe("vowel-i-long-short");
    expect(response.json().steps.flatMap((step: { practiceItems: unknown[] }) => step.practiceItems).length).toBeGreaterThan(0);
    expect(
      response.json().steps.reduce((sum: number, step: { minutes: number }) => sum + step.minutes, 0),
    ).toBe(10);
    await app.close();
  });

  it("exposes retrieved evidence for inspecting the RAG result", async () => {
    const app = buildApp(memoryAiProvider, localKnowledgeRetriever);
    const response = await app.inject({
      method: "POST",
      url: "/v1/knowledge/search",
      payload: {
        childAgeBand: "6–8 岁",
        goal: "练习 right 和 light 的区别",
        limit: 2,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().matches[0].knowledgeId).toBe("consonant-r-l");
    expect(response.json().matches[0].content).toBeUndefined();
    await app.close();
  });

  it("serves and scores the complete web practice demo", async () => {
    const scoringAgent = createScoringAgent(memoryLanguageAssessmentProvider);
    const app = buildApp(memoryAiProvider, localKnowledgeRetriever, scoringAgent);
    const exerciseResponse = await app.inject({ method: "GET", url: "/v1/practice/demo" });

    expect(exerciseResponse.statusCode).toBe(200);
    expect(exerciseResponse.json().id).toBe(demoExercise.id);

    const scoreResponse = await app.inject({
      method: "POST",
      url: "/v1/practice/score",
      payload: {
        sessionId: "session-api-test",
        exerciseId: demoExercise.id,
        exerciseVersion: demoExercise.version,
        childAgeBand: demoExercise.childAgeBand,
        listeningAttempts: demoExercise.listeningTrials.map((trial) => ({
          trialId: trial.id,
          selectedWord: trial.audioText,
          replayCount: 0,
          responseTimeMs: 900,
        })),
        transcript: "The sheep is on the ship.",
        recording: { durationMs: 2_000, mimeType: "audio/webm", sizeBytes: 10_000 },
        parentObservation: {
          listening: "stable",
          production: "independent",
          difficulty: "appropriate",
          note: "",
        },
      },
    });

    expect(scoreResponse.statusCode).toBe(200);
    expect(scoreResponse.json().dimensions.listening.score).toBe(100);
    expect(scoreResponse.json().dimensions.pronunciation.status).toBe("not_assessed");
    await app.close();
  });

  it("generates a RAG-grounded exercise and scores that exact version", async () => {
    const scoringAgent = createScoringAgent(memoryLanguageAssessmentProvider);
    const generator = createMemoryExerciseGenerator(localKnowledgeRetriever);
    const app = buildApp(memoryAiProvider, localKnowledgeRetriever, scoringAgent, generator);
    const generationResponse = await app.inject({
      method: "POST",
      url: "/v1/practice/generate",
      payload: {
        childAgeBand: "6–8 岁",
        goal: "区分 right 和 light",
        accent: "en-GB",
        trialCount: 6,
      },
    });

    expect(generationResponse.statusCode).toBe(200);
    const exercise = generationResponse.json();
    expect(exercise.words.map(({ word }: { word: string }) => word)).toEqual(["right", "light"]);
    expect(exercise.generation.source).toBe("memory");
    expect(exercise.listeningTrials).toHaveLength(6);

    const scoreResponse = await app.inject({
      method: "POST",
      url: "/v1/practice/score",
      payload: {
        sessionId: "session-generated-test",
        exerciseId: exercise.id,
        exerciseVersion: exercise.version,
        childAgeBand: exercise.childAgeBand,
        listeningAttempts: exercise.listeningTrials.map((trial: { id: string; audioText: string }) => ({
          trialId: trial.id,
          selectedWord: trial.audioText,
          replayCount: 0,
          responseTimeMs: 800,
        })),
        transcript: "I can hear right and light.",
        recording: { durationMs: 2_000, mimeType: "audio/webm", sizeBytes: 10_000 },
        parentObservation: {
          listening: "stable",
          production: "independent",
          difficulty: "appropriate",
          note: "",
        },
      },
    });

    expect(scoreResponse.statusCode).toBe(200);
    expect(scoreResponse.json().exerciseId).toBe(exercise.id);
    expect(scoreResponse.json().dimensions.listening.score).toBe(100);
    await app.close();
  });

  it("exposes the complete agentic lesson workflow", async () => {
    const orchestrator = createLessonOrchestrator({
      retriever: localKnowledgeRetriever,
      generationAgent: createMemoryLessonAgent(),
      reviewAgent: createMemoryLessonReviewAgent(),
      history: new InMemoryLessonHistoryStore(),
      reviewMode: "auto",
    });
    const app = buildApp(memoryAiProvider, localKnowledgeRetriever, undefined, undefined, orchestrator);
    const response = await app.inject({
      method: "POST",
      url: "/v1/lessons/generate",
      payload: {
        learnerId: "api-learner",
        childAgeBand: "6–8 岁",
        prompt: "水果主题的听说练习",
        accent: "en-US",
        minutesAvailable: 10,
        activityCount: 4,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().activities).toHaveLength(4);
    expect(response.json().orchestration.status).toBe("published");
    expect(response.json().evidence[0].knowledgeId).toBe("method-purposeful-oral-language");
    await app.close();
  });
});
