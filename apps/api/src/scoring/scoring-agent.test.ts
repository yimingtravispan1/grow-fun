import type { PracticeSubmission } from "@growfun/domain";
import { describe, expect, it } from "vitest";
import { demoExercise } from "../practice/demo-exercise.js";
import { memoryLanguageAssessmentProvider } from "./memory-language-provider.js";
import { createScoringAgent } from "./scoring-agent.js";

function validSubmission(): PracticeSubmission {
  return {
    sessionId: "session-test",
    exerciseId: demoExercise.id,
    exerciseVersion: demoExercise.version,
    childAgeBand: demoExercise.childAgeBand,
    listeningAttempts: demoExercise.listeningTrials.map((trial) => ({
      trialId: trial.id,
      selectedWord: trial.audioText,
      replayCount: 0,
      responseTimeMs: 1_200,
    })),
    transcript: "The sheep is on the ship.",
    recording: { durationMs: 2_500, mimeType: "audio/webm", sizeBytes: 12_000 },
    parentObservation: {
      listening: "stable",
      production: "independent",
      difficulty: "appropriate",
      note: "",
    },
  };
}

describe("scoring agent", () => {
  it("scores the assessable dimensions without inventing pronunciation accuracy", async () => {
    const score = await createScoringAgent(memoryLanguageAssessmentProvider).score(
      demoExercise,
      validSubmission(),
    );

    expect(score.status).toBe("scored");
    expect(score.dimensions.listening.score).toBe(100);
    expect(score.dimensions.content.score).toBe(100);
    expect(score.dimensions.pronunciation).toMatchObject({ status: "not_assessed", score: null });
    expect(score.scoreCoverage).toBe(0.8);
    expect(score.provenance.scoringMode).toBe("memory");
  });

  it("rejects a choice that was not offered in the exercise", async () => {
    const submission = validSubmission();
    submission.listeningAttempts[0]!.selectedWord = "shoe";

    await expect(
      createScoringAgent(memoryLanguageAssessmentProvider).score(demoExercise, submission),
    ).rejects.toThrow("Invalid listening attempt");
  });
});
