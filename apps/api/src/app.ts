import type { AiProvider, KnowledgeRetriever, LessonOrchestrator, PracticeExerciseGenerator, ScoringAgent } from "@growfun/domain";
import {
  journeyRequestSchema,
  knowledgeQuerySchema,
  lessonGenerationRequestSchema,
  practiceFeedbackSchema,
  practiceGenerationRequestSchema,
  practiceSubmissionSchema,
} from "@growfun/domain";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { demoExercise } from "./practice/demo-exercise.js";
import { InMemoryExerciseStore } from "./practice/in-memory-exercise-store.js";

export function buildApp(
  aiProvider: AiProvider,
  knowledgeRetriever?: KnowledgeRetriever,
  scoringAgent?: ScoringAgent,
  exerciseGenerator?: PracticeExerciseGenerator,
  lessonOrchestrator?: LessonOrchestrator,
) {
  const app = Fastify({ logger: true });
  const exerciseStore = new InMemoryExerciseStore();
  exerciseStore.save(demoExercise);
  app.register(cors, {
    origin: (origin, callback) => {
      const allowed = !origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      callback(allowed ? null : new Error("Origin is not allowed"), allowed);
    },
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.post("/v1/journeys/preview", async (request, reply) => {
    const parsed = journeyRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    }

    const journey = await aiProvider.prepareJourney(parsed.data);
    return reply.send(journey);
  });

  if (knowledgeRetriever) {
    app.post("/v1/knowledge/search", async (request, reply) => {
      const parsed = knowledgeQuerySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
      }

      const matches = await knowledgeRetriever.search(parsed.data);
      return reply.send({
        matches: matches.map(({ content: _content, keywords: _keywords, examples: _examples, ...match }) => match),
      });
    });
  }

  if (lessonOrchestrator) {
    app.post("/v1/lessons/generate", async (request, reply) => {
      const parsed = lessonGenerationRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
      }

      try {
        return reply.send(await lessonOrchestrator.generate(parsed.data));
      } catch (error) {
        request.log.warn({ error }, "Agentic lesson workflow could not be completed");
        return reply.code(422).send({ error: "lesson_generation_failed" });
      }
    });
  }

  if (scoringAgent) {
    app.get("/v1/practice/demo", async () => demoExercise);

    if (exerciseGenerator) {
      app.post("/v1/practice/generate", async (request, reply) => {
        const parsed = practiceGenerationRequestSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
        }

        try {
          const exercise = await exerciseGenerator.generate(parsed.data);
          exerciseStore.save(exercise);
          return reply.send(exercise);
        } catch (error) {
          request.log.warn({ error }, "Practice exercise could not be generated");
          return reply.code(422).send({ error: "practice_generation_failed" });
        }
      });
    }

    app.post("/v1/practice/score", async (request, reply) => {
      const parsed = practiceSubmissionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
      }
      const exercise = exerciseStore.get(parsed.data.exerciseId);
      if (!exercise) {
        return reply.code(404).send({ error: "exercise_not_found_or_expired" });
      }
      if (parsed.data.exerciseVersion !== exercise.version) {
        return reply.code(409).send({ error: "exercise_version_mismatch" });
      }

      try {
        return reply.send(await scoringAgent.score(exercise, parsed.data));
      } catch (error) {
        request.log.warn({ error }, "Practice submission could not be scored");
        return reply.code(400).send({ error: "invalid_practice_submission" });
      }
    });

    app.post("/v1/practice/feedback", async (request, reply) => {
      const parsed = practiceFeedbackSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
      }
      return reply.code(202).send({ accepted: true });
    });
  }

  return app;
}
