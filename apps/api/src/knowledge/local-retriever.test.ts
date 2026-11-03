import { describe, expect, it } from "vitest";
import { localKnowledgeRetriever } from "./local-retriever.js";

describe("localKnowledgeRetriever", () => {
  it.each([
    ["辨别 ship 和 sheep", "vowel-i-long-short"],
    ["练习 right light，解决 r 和 l", "consonant-r-l"],
    ["听出 fan 和 van 的不同", "consonant-f-v"],
    ["练习单词重音和节奏", "word-stress"],
  ])("retrieves relevant knowledge for %s", async (goal, expectedId) => {
    const matches = await localKnowledgeRetriever.search({
      childAgeBand: "6–8 岁",
      goal,
      limit: 3,
    });

    const [first, second] = matches;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first?.knowledgeId).toBe(expectedId);
    expect(first?.score ?? 0).toBeGreaterThan(second?.score ?? 0);
  });
});
