import type { PracticeExerciseGenerator } from "@growfun/domain";
import { config } from "../config.js";
import { localKnowledgeRetriever } from "../knowledge/local-retriever.js";
import { createMemoryExerciseGenerator } from "./memory-exercise-generator.js";
import { createOpenAiExerciseGenerator } from "./openai-exercise-generator.js";
import { createOpenSourceExerciseGenerator } from "./open-source-exercise-generator.js";

const cases = [
  { goal: "孩子容易混淆 ship 和 sheep，先听辨再说一句话", expectedWords: ["ship", "sheep"] },
  { goal: "区分 right 和 light", expectedWords: ["right", "light"] },
  { goal: "听出 fan 和 van", expectedWords: ["fan", "van"] },
  { goal: "练习 bed 和 bid", expectedWords: ["bed", "bid"] },
  { goal: "区分 cap 和 cup", expectedWords: ["cap", "cup"] },
  { goal: "练习 full 和 fool", expectedWords: ["full", "fool"] },
  { goal: "听辨 pack 和 back", expectedWords: ["pack", "back"] },
  { goal: "区分 coat 和 goat", expectedWords: ["coat", "goat"] },
] as const;

function configuredGenerator(): PracticeExerciseGenerator {
  if (config.exerciseProvider === "openai") {
    return createOpenAiExerciseGenerator(config.openAiExerciseModel as string, localKnowledgeRetriever);
  }
  if (config.exerciseProvider === "open_source") {
    return createOpenSourceExerciseGenerator({
      apiKey: config.openSourceLlmApiKey,
      baseURL: config.openSourceLlmBaseUrl as string,
      model: config.openSourceLlmModel as string,
      retriever: localKnowledgeRetriever,
      useJsonMode: config.openSourceLlmUseJsonMode,
    });
  }
  return createMemoryExerciseGenerator(localKnowledgeRetriever);
}

const generator = configuredGenerator();
const results = [];

for (const testCase of cases) {
  const startedAt = performance.now();
  try {
    const exercise = await generator.generate({
      childAgeBand: "6–8 岁",
      goal: testCase.goal,
      accent: "en-GB",
      trialCount: 8,
    });
    const actualWords = exercise.words.map(({ word }) => word);
    const balanced = actualWords.every(
      (word) => exercise.listeningTrials.filter(({ audioText }) => audioText === word).length === 4,
    );
    results.push({
      goal: testCase.goal,
      passed:
        actualWords.join("|") === testCase.expectedWords.join("|") &&
        balanced &&
        exercise.generation.evidence.length > 0 &&
        exercise.generation.validationChecks.length >= 5,
      latencyMs: Math.round(performance.now() - startedAt),
      expectedWords: testCase.expectedWords,
      actualWords,
      evidenceIds: exercise.generation.evidence.map(({ knowledgeId }) => knowledgeId),
    });
  } catch (error) {
    results.push({
      goal: testCase.goal,
      passed: false,
      latencyMs: Math.round(performance.now() - startedAt),
      expectedWords: testCase.expectedWords,
      error: error instanceof Error ? error.message : "Unknown generation error",
    });
  }
}

const passed = results.filter((result) => result.passed).length;
const report = {
  provider: generator.mode,
  model:
    config.exerciseProvider === "open_source"
      ? config.openSourceLlmModel
      : config.exerciseProvider === "openai"
        ? config.openAiExerciseModel
        : null,
  generatedAt: new Date().toISOString(),
  summary: {
    passed,
    total: results.length,
    structuralPassRate: passed / results.length,
    averageLatencyMs: Math.round(results.reduce((sum, result) => sum + result.latencyMs, 0) / results.length),
  },
  results,
  manualReviewStillRequired: ["中文是否适龄", "示例句是否自然", "家长提示是否可执行", "资料是否需要专业教师复核"],
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (passed !== results.length) process.exitCode = 1;
