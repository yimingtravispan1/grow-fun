import { lessonDraftSchema, lessonReviewResultSchema } from "@growfun/domain";
import { zodTextFormat } from "openai/helpers/zod";

export const lessonDraftTextFormat = zodTextFormat(lessonDraftSchema, "growfun_lesson_draft");

export const lessonReviewTextFormat = zodTextFormat(
  lessonReviewResultSchema,
  "growfun_lesson_review",
);
