import type { PracticeExercise } from "@growfun/domain";
import { practiceExerciseSchema } from "@growfun/domain";

export const demoExercise: PracticeExercise = practiceExerciseSchema.parse({
  id: "sound-i-short-long",
  version: "1.0.0",
  title: "听清 ship 和 sheep",
  childAgeBand: "6–8 岁",
  accent: "en-GB",
  targetLabel: "/ɪ/ 与 /iː/",
  targetDescription: "先听辨两个相近元音，再用一句话表达。",
  words: [
    { word: "ship", ipa: "/ʃɪp/" },
    { word: "sheep", ipa: "/ʃiːp/" },
  ],
  listeningTrials: [
    { id: "trial-1", audioText: "ship", choices: ["ship", "sheep"] },
    { id: "trial-2", audioText: "sheep", choices: ["ship", "sheep"] },
    { id: "trial-3", audioText: "sheep", choices: ["ship", "sheep"] },
    { id: "trial-4", audioText: "ship", choices: ["ship", "sheep"] },
    { id: "trial-5", audioText: "ship", choices: ["ship", "sheep"] },
    { id: "trial-6", audioText: "sheep", choices: ["ship", "sheep"] },
    { id: "trial-7", audioText: "ship", choices: ["ship", "sheep"] },
    { id: "trial-8", audioText: "sheep", choices: ["ship", "sheep"] },
  ],
  speakingPrompt: "请用 ship 和 sheep 说一句完整的话。",
  suggestedSentence: "The sheep is on the ship.",
  requiredConcepts: ["ship", "sheep"],
  rubricVersion: "growfun-speaking-rubric-0.1",
  generation: {
    source: "memory",
    modelVersion: null,
    goal: "辨别 ship 和 sheep",
    generatedAt: "2026-09-28T00:00:00.000Z",
    evidence: [
      {
        knowledgeId: "vowel-i-long-short",
        title: "/ɪ/ 与 /iː/",
        summary: "比较 ship–sheep 等词，听辨较短、较松与较长、较紧的元音。",
        sourceTitle: "British Council TeachingEnglish — Phonemic chart for English teachers",
        sourceUrl:
          "https://www.teachingenglish.org.uk/teaching-resources/teaching-secondary/teaching-tools/phonemic-chart-english-teachers",
        score: 1,
      },
    ],
    validationChecks: ["词对来自审核知识库", "两词题量相同", "每题答案属于目标词对"],
  },
});
