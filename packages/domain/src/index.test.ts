import { describe, expect, it } from "vitest";
import {
  dailyJourneySchema,
  journeyRequestSchema,
  lessonActivitySchema,
  lessonGenerationRequestSchema,
  practiceGenerationRequestSchema,
} from "./index.js";

describe("journeyRequestSchema", () => {
  it("applies the default session length", () => {
    const result = journeyRequestSchema.parse({
      familyId: "family-test",
      childAgeBand: "provisional",
      goal: "practice one learning goal",
    });

    expect(result.minutesAvailable).toBe(10);
  });

  it("rejects sessions outside the MVP time box", () => {
    const result = journeyRequestSchema.safeParse({
      familyId: "family-test",
      childAgeBand: "provisional",
      goal: "practice one learning goal",
      minutesAvailable: 30,
    });

    expect(result.success).toBe(false);
  });
});

describe("dailyJourneySchema", () => {
  const baseJourney = {
    id: "journey-test",
    title: "test",
    focus: "test focus",
    steps: [
      {
        title: "listen",
        guidance: "listen once",
        minutes: 5,
        activityType: "listen" as const,
        practiceItems: [
          { word: "ship", ipa: "/ʃɪp/", contrastWord: "sheep", contrastIpa: "/ʃiːp/" },
        ],
      },
    ],
    parentNote: "test note",
    evidence: [
      {
        knowledgeId: "knowledge-test",
        title: "source",
        summary: "summary",
        sourceTitle: "source title",
        sourceUrl: "https://example.com/source",
        score: 0.9,
      },
    ],
    review: { status: "demo_reviewed" as const, checks: ["checked"] },
    source: "memory" as const,
  };

  it("enforces the maximum journey duration as a business rule", () => {
    const result = dailyJourneySchema.safeParse({
      ...baseJourney,
      steps: [{ ...baseJourney.steps[0], minutes: 21 }],
    });
    expect(result.success).toBe(false);
  });

  it("requires contrast words and IPA transcriptions together", () => {
    const result = dailyJourneySchema.safeParse({
      ...baseJourney,
      steps: [
        {
          ...baseJourney.steps[0],
          practiceItems: [{ word: "ship", ipa: "/ʃɪp/", contrastWord: "sheep", contrastIpa: null }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("practiceGenerationRequestSchema", () => {
  it("accepts a bounded user prompt and balanced trial count", () => {
    const request = practiceGenerationRequestSchema.parse({
      childAgeBand: "6–8 岁",
      goal: "区分 right 和 light",
      accent: "en-GB",
      trialCount: 8,
    });
    expect(request.trialCount).toBe(8);
  });

  it("rejects odd trial counts because target exposure would be unbalanced", () => {
    expect(
      practiceGenerationRequestSchema.safeParse({
        childAgeBand: "6–8 岁",
        goal: "区分 right 和 light",
        accent: "en-GB",
        trialCount: 7,
      }).success,
    ).toBe(false);
  });
});

describe("agentic lesson schemas", () => {
  it("applies bounded defaults to a free-form lesson request", () => {
    const request = lessonGenerationRequestSchema.parse({
      childAgeBand: "6–8 岁",
      prompt: "用水果主题练习听说",
    });

    expect(request.activityCount).toBe(4);
    expect(request.minutesAvailable).toBe(10);
    expect(request.learnerId).toBe("demo-learner");
  });

  it("requires a deterministic answer for closed activities", () => {
    const result = lessonActivitySchema.safeParse({
      id: "activity-1",
      type: "listening_comprehension",
      title: "listen",
      instruction: "listen and choose",
      stimulus: "Mia buys an apple.",
      question: "What does Mia buy?",
      choices: ["apple", "banana"],
      answer: "orange",
      answerExplanation: "test",
      languageSupport: [],
      targetConcepts: ["apple"],
      evidenceIds: ["knowledge-1"],
      durationMinutes: 2,
    });

    expect(result.success).toBe(false);
  });
});
