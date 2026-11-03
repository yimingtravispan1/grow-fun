import { describe, expect, it } from "vitest";
import { localKnowledgeRetriever } from "../knowledge/local-retriever.js";
import { InMemoryLessonHistoryStore } from "./in-memory-lesson-history.js";
import { createLessonOrchestrator } from "./lesson-orchestrator.js";
import { createMemoryLessonAgent } from "./memory-lesson-agent.js";
import { createMemoryLessonReviewAgent } from "./lesson-review-agents.js";

describe("lesson orchestrator", () => {
  it("publishes a diverse, RAG-grounded lesson through deterministic gates", async () => {
    const orchestrator = createLessonOrchestrator({
      retriever: localKnowledgeRetriever,
      generationAgent: createMemoryLessonAgent(),
      reviewAgent: createMemoryLessonReviewAgent(),
      history: new InMemoryLessonHistoryStore(),
      reviewMode: "auto",
    });

    const lesson = await orchestrator.generate({
      learnerId: "learner-test",
      childAgeBand: "6–8 岁",
      prompt: "生成水果主题的听说练习",
      accent: "en-US",
      minutesAvailable: 10,
      activityCount: 4,
    });

    expect(lesson.activities).toHaveLength(4);
    expect(new Set(lesson.activities.map(({ type }) => type)).size).toBeGreaterThanOrEqual(2);
    expect(lesson.activities.every(({ evidenceIds }) => evidenceIds.length > 0)).toBe(true);
    expect(lesson.orchestration.status).toBe("published");
    expect(lesson.orchestration.novelty.exactDuplicates).toBe(0);
    expect(lesson.orchestration.validationChecks.length).toBeGreaterThanOrEqual(7);

    const nextLesson = await orchestrator.generate({
      ...lesson.request,
      prompt: "再生成一套水果主题听说练习，但不要重复上一套",
    });
    const previousQuestions = new Set(lesson.activities.map(({ question }) => question));
    expect(nextLesson.activities.every(({ question }) => !previousQuestions.has(question))).toBe(true);
    expect(nextLesson.orchestration.novelty.comparedLessons).toBe(1);
    expect(nextLesson.orchestration.novelty.exactDuplicates).toBe(0);
  });

  it("runs the review agent when the cost policy requires it", async () => {
    const orchestrator = createLessonOrchestrator({
      retriever: localKnowledgeRetriever,
      generationAgent: createMemoryLessonAgent(),
      reviewAgent: createMemoryLessonReviewAgent(),
      history: new InMemoryLessonHistoryStore(),
      reviewMode: "always",
    });

    const lesson = await orchestrator.generate({
      learnerId: "learner-reviewed",
      childAgeBand: "4–5 岁",
      prompt: "水果主题听力",
      accent: "en-GB",
      minutesAvailable: 8,
      activityCount: 3,
    });

    expect(lesson.orchestration.review.status).toBe("passed");
    expect(lesson.orchestration.review.source).toBe("memory");
    expect(lesson.orchestration.events.some(({ state }) => state === "reviewed")).toBe(true);
  });
});
