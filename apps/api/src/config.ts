const provider = process.env.AI_PROVIDER ?? "memory";
const ragProvider = process.env.RAG_PROVIDER ?? "memory";
const scoringProvider = process.env.SCORING_PROVIDER ?? "memory";
const exerciseProvider = process.env.EXERCISE_PROVIDER ?? "memory";
const lessonProvider = process.env.LESSON_PROVIDER ?? exerciseProvider;
const lessonReviewProvider = process.env.LESSON_REVIEW_PROVIDER ?? lessonProvider;
const lessonReviewMode = process.env.LESSON_REVIEW_MODE ?? "auto";

if (provider !== "memory" && provider !== "openai") {
  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

if (ragProvider !== "memory" && ragProvider !== "openai") {
  throw new Error(`Unsupported RAG_PROVIDER: ${ragProvider}`);
}

if (scoringProvider !== "memory" && scoringProvider !== "openai") {
  throw new Error(`Unsupported SCORING_PROVIDER: ${scoringProvider}`);
}

if (exerciseProvider !== "memory" && exerciseProvider !== "openai" && exerciseProvider !== "open_source") {
  throw new Error(`Unsupported EXERCISE_PROVIDER: ${exerciseProvider}`);
}

if (lessonProvider !== "memory" && lessonProvider !== "openai" && lessonProvider !== "open_source") {
  throw new Error(`Unsupported LESSON_PROVIDER: ${lessonProvider}`);
}

if (lessonReviewProvider !== "memory" && lessonReviewProvider !== "openai" && lessonReviewProvider !== "open_source") {
  throw new Error(`Unsupported LESSON_REVIEW_PROVIDER: ${lessonReviewProvider}`);
}

if (lessonReviewMode !== "auto" && lessonReviewMode !== "always" && lessonReviewMode !== "never") {
  throw new Error(`Unsupported LESSON_REVIEW_MODE: ${lessonReviewMode}`);
}

if (provider === "openai" && !process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
}

if (ragProvider === "openai" && (!process.env.OPENAI_API_KEY || !process.env.OPENAI_VECTOR_STORE_ID)) {
  throw new Error("OPENAI_API_KEY and OPENAI_VECTOR_STORE_ID are required when RAG_PROVIDER=openai");
}

if (scoringProvider === "openai" && (!process.env.OPENAI_API_KEY || !(process.env.OPENAI_SCORING_MODEL ?? process.env.OPENAI_MODEL))) {
  throw new Error("OPENAI_API_KEY and OPENAI_SCORING_MODEL (or OPENAI_MODEL) are required when SCORING_PROVIDER=openai");
}

if (exerciseProvider === "openai" && (!process.env.OPENAI_API_KEY || !(process.env.OPENAI_EXERCISE_MODEL ?? process.env.OPENAI_MODEL))) {
  throw new Error("OPENAI_API_KEY and OPENAI_EXERCISE_MODEL (or OPENAI_MODEL) are required when EXERCISE_PROVIDER=openai");
}

if (exerciseProvider === "open_source" && (!process.env.OPEN_SOURCE_LLM_BASE_URL || !process.env.OPEN_SOURCE_LLM_MODEL)) {
  throw new Error("OPEN_SOURCE_LLM_BASE_URL and OPEN_SOURCE_LLM_MODEL are required when EXERCISE_PROVIDER=open_source");
}

if (
  (lessonProvider === "openai" || lessonReviewProvider === "openai") &&
  (!process.env.OPENAI_API_KEY || !(process.env.OPENAI_LESSON_MODEL ?? process.env.OPENAI_EXERCISE_MODEL ?? process.env.OPENAI_MODEL))
) {
  throw new Error("OPENAI_API_KEY and OPENAI_LESSON_MODEL (or another configured OpenAI model) are required for OpenAI lesson agents");
}

if (
  (lessonProvider === "open_source" || lessonReviewProvider === "open_source") &&
  (!process.env.OPEN_SOURCE_LLM_BASE_URL || !process.env.OPEN_SOURCE_LLM_MODEL)
) {
  throw new Error("OPEN_SOURCE_LLM_BASE_URL and OPEN_SOURCE_LLM_MODEL are required for open-source lesson agents");
}

if (process.env.OPEN_SOURCE_LLM_BASE_URL) {
  try {
    new URL(process.env.OPEN_SOURCE_LLM_BASE_URL);
  } catch {
    throw new Error("OPEN_SOURCE_LLM_BASE_URL must be a valid absolute URL");
  }
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  aiProvider: provider,
  ragProvider,
  scoringProvider,
  exerciseProvider,
  lessonProvider,
  lessonReviewProvider,
  lessonReviewMode,
  openAiModel: process.env.OPENAI_MODEL,
  openAiScoringModel: process.env.OPENAI_SCORING_MODEL ?? process.env.OPENAI_MODEL,
  openAiExerciseModel: process.env.OPENAI_EXERCISE_MODEL ?? process.env.OPENAI_MODEL,
  openAiLessonModel: process.env.OPENAI_LESSON_MODEL ?? process.env.OPENAI_EXERCISE_MODEL ?? process.env.OPENAI_MODEL,
  openAiLessonReviewModel:
    process.env.OPENAI_LESSON_REVIEW_MODEL ?? process.env.OPENAI_LESSON_MODEL ?? process.env.OPENAI_EXERCISE_MODEL ?? process.env.OPENAI_MODEL,
  openSourceLlmBaseUrl: process.env.OPEN_SOURCE_LLM_BASE_URL,
  openSourceLlmApiKey: process.env.OPEN_SOURCE_LLM_API_KEY,
  openSourceLlmModel: process.env.OPEN_SOURCE_LLM_MODEL,
  openSourceLlmUseJsonMode: process.env.OPEN_SOURCE_LLM_JSON_MODE !== "false",
  openAiVectorStoreId: process.env.OPENAI_VECTOR_STORE_ID,
} as const;
