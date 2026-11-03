import { describe, expect, it } from "vitest";
import { localKnowledgeRetriever } from "../knowledge/local-retriever.js";
import { createMemoryExerciseGenerator } from "./memory-exercise-generator.js";

describe("memory exercise generator", () => {
  it.each([
    ["区分 right 和 light", ["right", "light"]],
    ["听出 fan 和 van", ["fan", "van"]],
    ["练习 bed 和 bid", ["bed", "bid"]],
  ])("grounds %s in an approved minimal pair", async (goal, expectedWords) => {
    const exercise = await createMemoryExerciseGenerator(localKnowledgeRetriever).generate({
      childAgeBand: "6–8 岁",
      goal,
      accent: "en-GB",
      trialCount: 8,
    });

    expect(exercise.words.map(({ word }) => word)).toEqual(expectedWords);
    expect(exercise.generation.evidence[0]?.knowledgeId).toBeTruthy();
    expect(exercise.generation.validationChecks.length).toBeGreaterThanOrEqual(5);
    expect(exercise.listeningTrials).toHaveLength(8);
    expect(exercise.listeningTrials.filter(({ audioText }) => audioText === expectedWords[0])).toHaveLength(4);
    expect(exercise.listeningTrials.filter(({ audioText }) => audioText === expectedWords[1])).toHaveLength(4);
  });
});
