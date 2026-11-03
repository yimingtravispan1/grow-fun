import { z } from "zod";

export const journeyRequestSchema = z.object({
  familyId: z.string().min(1),
  childAgeBand: z.string().min(1).max(40),
  goal: z.string().min(1).max(300),
  minutesAvailable: z.number().int().min(5).max(20).default(10),
});

export type JourneyRequest = z.infer<typeof journeyRequestSchema>;

export const practiceItemSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().min(1),
  contrastWord: z.string().min(1).nullable(),
  contrastIpa: z.string().min(1).nullable(),
});

export const journeyStepSchema = z.object({
  title: z.string().min(1),
  guidance: z.string().min(1),
  minutes: z.number().int().positive(),
  activityType: z.enum(["notice", "listen", "contrast", "produce", "reflect"]),
  practiceItems: z.array(practiceItemSchema).max(6),
});

export const evidenceSchema = z.object({
  knowledgeId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().url(),
  score: z.number().min(0).max(1),
});

export const reviewSchema = z.object({
  status: z.enum(["demo_reviewed", "ai_generated"]),
  checks: z.array(z.string().min(1)).min(1),
});

export const dailyJourneySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    focus: z.string().min(1),
    steps: z.array(journeyStepSchema).min(1).max(5),
    parentNote: z.string().min(1),
    evidence: z.array(evidenceSchema).min(1).max(5),
    review: reviewSchema,
    source: z.enum(["memory", "openai"]),
  })
  .superRefine((journey, context) => {
    const totalMinutes = journey.steps.reduce((sum, step) => sum + step.minutes, 0);
    if (totalMinutes > 20) {
      context.addIssue({
        code: "custom",
        message: "A journey cannot exceed the 20-minute MVP limit.",
        path: ["steps"],
      });
    }

    for (const [stepIndex, step] of journey.steps.entries()) {
      for (const [itemIndex, item] of step.practiceItems.entries()) {
        if ((item.contrastWord === null) !== (item.contrastIpa === null)) {
          context.addIssue({
            code: "custom",
            message: "A contrast word and its IPA transcription must be provided together.",
            path: ["steps", stepIndex, "practiceItems", itemIndex],
          });
        }
      }
    }
  });

export type DailyJourney = z.infer<typeof dailyJourneySchema>;

export type Evidence = z.infer<typeof evidenceSchema>;

export const knowledgeQuerySchema = journeyRequestSchema
  .pick({ childAgeBand: true, goal: true })
  .extend({ limit: z.number().int().min(1).max(5).optional() });

export type KnowledgeQuery = z.infer<typeof knowledgeQuerySchema>;

export type KnowledgeMatch = Evidence & {
  content: string;
  keywords: string[];
  examples: Array<z.infer<typeof practiceItemSchema>>;
};

export interface KnowledgeRetriever {
  search(input: KnowledgeQuery): Promise<KnowledgeMatch[]>;
}

export interface AiProvider {
  prepareJourney(input: JourneyRequest): Promise<DailyJourney>;
}

export const listeningTrialSchema = z.object({
  id: z.string().min(1),
  audioText: z.string().min(1),
  choices: z.tuple([z.string().min(1), z.string().min(1)]),
});

export const practiceGenerationRequestSchema = z
  .object({
    childAgeBand: z.string().min(1).max(40),
    goal: z.string().trim().min(2).max(200),
    accent: z.enum(["en-US", "en-GB"]).default("en-GB"),
    trialCount: z.number().int().min(4).max(12).default(8),
  })
  .superRefine((request, context) => {
    if (request.trialCount % 2 !== 0) {
      context.addIssue({
        code: "custom",
        message: "trialCount must be even so both target words appear equally often.",
        path: ["trialCount"],
      });
    }
  });

export type PracticeGenerationRequest = z.infer<typeof practiceGenerationRequestSchema>;

export const practiceExerciseSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    title: z.string().min(1),
    childAgeBand: z.string().min(1),
    accent: z.enum(["en-US", "en-GB"]),
    targetLabel: z.string().min(1),
    targetDescription: z.string().min(1),
    words: z.tuple([
      z.object({ word: z.string().min(1), ipa: z.string().min(1) }),
      z.object({ word: z.string().min(1), ipa: z.string().min(1) }),
    ]),
    listeningTrials: z.array(listeningTrialSchema).min(4).max(12),
    speakingPrompt: z.string().min(1),
    suggestedSentence: z.string().min(1),
    requiredConcepts: z.array(z.string().min(1)).min(1).max(5),
    rubricVersion: z.string().min(1),
    generation: z.object({
      source: z.enum(["memory", "openai", "open_source"]),
      modelVersion: z.string().min(1).nullable(),
      goal: z.string().min(1),
      evidence: z.array(evidenceSchema).min(1).max(5),
      validationChecks: z.array(z.string().min(1)).min(1).max(10),
      generatedAt: z.string().datetime(),
    }),
  })
  .superRefine((exercise, context) => {
    const targetWords = exercise.words.map(({ word }) => word);
    const targetSet = new Set(targetWords);
    const trialIds = new Set<string>();

    for (const [index, trial] of exercise.listeningTrials.entries()) {
      if (trialIds.has(trial.id)) {
        context.addIssue({ code: "custom", message: "Listening trial IDs must be unique.", path: ["listeningTrials", index, "id"] });
      }
      trialIds.add(trial.id);

      if (!targetSet.has(trial.audioText) || new Set(trial.choices).size !== 2 || trial.choices.some((choice) => !targetSet.has(choice))) {
        context.addIssue({
          code: "custom",
          message: "Every listening trial must use exactly the exercise's two approved target words.",
          path: ["listeningTrials", index],
        });
      }
    }
  });

export type PracticeExercise = z.infer<typeof practiceExerciseSchema>;

export const listeningAttemptSchema = z.object({
  trialId: z.string().min(1),
  selectedWord: z.string().min(1),
  replayCount: z.number().int().min(0).max(20),
  responseTimeMs: z.number().int().min(0).max(120_000),
});

export const practiceSubmissionSchema = z.object({
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  exerciseVersion: z.string().min(1),
  childAgeBand: z.string().min(1).max(40),
  listeningAttempts: z.array(listeningAttemptSchema).min(1).max(20),
  transcript: z.string().trim().max(500),
  recording: z
    .object({
      durationMs: z.number().int().min(250).max(60_000),
      mimeType: z.string().min(1).max(100),
      sizeBytes: z.number().int().positive().max(5_000_000),
    })
    .nullable(),
  parentObservation: z.object({
    listening: z.enum(["not_yet", "sometimes", "stable"]),
    production: z.enum(["difficult", "needs_prompt", "independent"]),
    difficulty: z.enum(["too_easy", "appropriate", "too_hard"]),
    note: z.string().trim().max(300),
  }),
});

export type PracticeSubmission = z.infer<typeof practiceSubmissionSchema>;

export const languageIssueSchema = z.object({
  original: z.string(),
  suggestion: z.string(),
  explanation: z.string().min(1),
});

const scoreDimensionSchema = z.object({
  score: z.number().min(0).max(100),
  evidence: z.string().min(1),
});

export const practiceScoreSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  status: z.enum(["scored", "needs_retry", "needs_review"]),
  overallScore: z.number().min(0).max(100),
  scoreCoverage: z.number().min(0).max(1),
  dimensions: z.object({
    listening: scoreDimensionSchema.extend({
      correct: z.number().int().nonnegative(),
      total: z.number().int().positive(),
      replayCount: z.number().int().nonnegative(),
    }),
    taskCompletion: scoreDimensionSchema,
    content: scoreDimensionSchema,
    grammar: scoreDimensionSchema.extend({ issues: z.array(languageIssueSchema).max(5) }),
    pronunciation: z.object({
      status: z.enum(["not_assessed", "assessed", "low_confidence"]),
      score: z.number().min(0).max(100).nullable(),
      evidence: z.string().min(1),
      provider: z.string().nullable(),
    }),
  }),
  confidence: z.number().min(0).max(1),
  strength: z.string().min(1),
  nextAction: z.string().min(1),
  childMessage: z.string().min(1),
  parentMessage: z.string().min(1),
  provenance: z.object({
    scoringMode: z.enum(["memory", "openai"]),
    rubricVersion: z.string().min(1),
    modelVersion: z.string().nullable(),
    createdAt: z.string().datetime(),
  }),
});

export type PracticeScore = z.infer<typeof practiceScoreSchema>;

export type LanguageAssessment = Pick<PracticeScore, "confidence" | "strength" | "nextAction"> & {
  taskCompletion: z.infer<typeof scoreDimensionSchema>;
  content: z.infer<typeof scoreDimensionSchema>;
  grammar: z.infer<typeof scoreDimensionSchema> & { issues: Array<z.infer<typeof languageIssueSchema>> };
};

export interface LanguageAssessmentProvider {
  readonly mode: "memory" | "openai";
  readonly modelVersion: string | null;
  assess(input: {
    transcript: string;
    prompt: string;
    requiredConcepts: string[];
    childAgeBand: string;
  }): Promise<LanguageAssessment>;
}

export interface ScoringAgent {
  score(exercise: PracticeExercise, submission: PracticeSubmission): Promise<PracticeScore>;
}

export interface PracticeExerciseGenerator {
  readonly mode: "memory" | "openai" | "open_source";
  generate(input: PracticeGenerationRequest): Promise<PracticeExercise>;
}

export const lessonActivityTypeSchema = z.enum([
  "sound_discrimination",
  "vocabulary_listening",
  "listening_comprehension",
  "guided_speaking",
]);

export type LessonActivityType = z.infer<typeof lessonActivityTypeSchema>;

export const lessonGenerationRequestSchema = z.object({
  learnerId: z.string().trim().min(1).max(100).default("demo-learner"),
  childAgeBand: z.string().trim().min(1).max(40),
  prompt: z.string().trim().min(2).max(500),
  accent: z.enum(["en-US", "en-GB"]).default("en-US"),
  minutesAvailable: z.number().int().min(5).max(20).default(10),
  activityCount: z.number().int().min(2).max(5).default(4),
});

export type LessonGenerationRequest = z.infer<typeof lessonGenerationRequestSchema>;

export const lessonActivitySchema = z
  .object({
    id: z.string().min(1),
    type: lessonActivityTypeSchema,
    title: z.string().min(1).max(100),
    instruction: z.string().min(1).max(240),
    stimulus: z.string().min(1).max(600),
    question: z.string().min(1).max(300),
    choices: z.array(z.string().min(1).max(120)).max(4),
    answer: z.string().min(1).max(300),
    answerExplanation: z.string().min(1).max(300),
    languageSupport: z.array(z.string().min(1).max(160)).max(5),
    targetConcepts: z.array(z.string().min(1).max(80)).min(1).max(8),
    evidenceIds: z.array(z.string().min(1)).min(1).max(5),
    durationMinutes: z.number().int().min(1).max(8),
  })
  .superRefine((activity, context) => {
    if (activity.type === "guided_speaking") {
      if (activity.choices.length !== 0) {
        context.addIssue({
          code: "custom",
          message: "Guided speaking activities must not use fixed answer choices.",
          path: ["choices"],
        });
      }
      return;
    }

    if (activity.choices.length < 2 || !activity.choices.includes(activity.answer)) {
      context.addIssue({
        code: "custom",
        message: "Closed activities need at least two choices and the answer must be one of them.",
        path: ["choices"],
      });
    }
  });

export type LessonActivity = z.infer<typeof lessonActivitySchema>;

const lessonDraftBaseSchema = z.object({
    title: z.string().min(1).max(100),
    summary: z.string().min(1).max(400),
    learningObjectives: z.array(z.string().min(1).max(180)).min(1).max(4),
    activities: z.array(lessonActivitySchema).min(2).max(5),
    parentNote: z.string().min(1).max(400),
    riskFlags: z.array(z.string().min(1).max(160)).max(5),
  });

export const lessonDraftSchema = lessonDraftBaseSchema.superRefine((lesson, context) => {
    const ids = new Set<string>();
    for (const [index, activity] of lesson.activities.entries()) {
      if (ids.has(activity.id)) {
        context.addIssue({
          code: "custom",
          message: "Lesson activity IDs must be unique.",
          path: ["activities", index, "id"],
        });
      }
      ids.add(activity.id);
    }
  });

export type LessonDraft = z.infer<typeof lessonDraftSchema>;

export const lessonReviewResultSchema = z.object({
  decision: z.enum(["pass", "revise"]),
  issues: z.array(z.string().min(1).max(240)).max(8),
  strengths: z.array(z.string().min(1).max(240)).max(5),
});

export type LessonReviewResult = z.infer<typeof lessonReviewResultSchema>;

export const workflowEventSchema = z.object({
  state: z.enum(["received", "retrieved", "generated", "validated", "reviewed", "revising", "published"]),
  detail: z.string().min(1).max(240),
  at: z.string().datetime(),
});

export const lessonPlanSchema = lessonDraftBaseSchema.omit({ riskFlags: true }).extend({
  id: z.string().min(1),
  version: z.string().min(1),
  request: lessonGenerationRequestSchema,
  evidence: z.array(evidenceSchema).min(1).max(5),
  orchestration: z.object({
    workflowId: z.string().min(1),
    status: z.literal("published"),
    events: z.array(workflowEventSchema).min(5).max(12),
    generation: z.object({
      source: z.enum(["memory", "openai", "open_source"]),
      modelVersion: z.string().min(1).nullable(),
      attempts: z.number().int().min(1).max(2),
    }),
    review: z.object({
      status: z.enum(["not_required", "passed", "revised"]),
      source: z.enum(["memory", "openai", "open_source"]).nullable(),
      modelVersion: z.string().min(1).nullable(),
      reasons: z.array(z.string().min(1).max(240)).max(8),
    }),
    novelty: z.object({
      comparedLessons: z.number().int().nonnegative(),
      exactDuplicates: z.number().int().nonnegative(),
      nearDuplicates: z.number().int().nonnegative(),
      intentionalReview: z.boolean(),
    }),
    validationChecks: z.array(z.string().min(1)).min(1).max(12),
  }),
});

export type LessonPlan = z.infer<typeof lessonPlanSchema>;

export type RecentLessonSummary = Pick<LessonPlan, "id" | "title" | "learningObjectives" | "activities">;

export interface LessonGenerationAgent {
  readonly mode: "memory" | "openai" | "open_source";
  readonly modelVersion: string | null;
  generate(input: {
    request: LessonGenerationRequest;
    evidence: KnowledgeMatch[];
    recentLessons: RecentLessonSummary[];
    revisionIssues: string[];
  }): Promise<LessonDraft>;
}

export interface LessonReviewAgent {
  readonly mode: "memory" | "openai" | "open_source";
  readonly modelVersion: string | null;
  review(input: {
    request: LessonGenerationRequest;
    draft: LessonDraft;
    evidence: KnowledgeMatch[];
  }): Promise<LessonReviewResult>;
}

export interface LessonOrchestrator {
  generate(input: LessonGenerationRequest): Promise<LessonPlan>;
}

export const practiceFeedbackSchema = z.object({
  scoreId: z.string().min(1),
  helpful: z.boolean(),
  note: z.string().trim().max(300),
});
