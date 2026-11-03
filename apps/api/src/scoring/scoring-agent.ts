import type {
  LanguageAssessmentProvider,
  PracticeExercise,
  PracticeScore,
  PracticeSubmission,
  ScoringAgent,
} from "@growfun/domain";
import { practiceScoreSchema } from "@growfun/domain";

function round(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createScoringAgent(languageProvider: LanguageAssessmentProvider): ScoringAgent {
  return {
    async score(exercise: PracticeExercise, submission: PracticeSubmission): Promise<PracticeScore> {
      const trials = new Map(exercise.listeningTrials.map((trial) => [trial.id, trial]));
      const uniqueAttempts = new Map(submission.listeningAttempts.map((attempt) => [attempt.trialId, attempt]));

      for (const attempt of uniqueAttempts.values()) {
        const trial = trials.get(attempt.trialId);
        if (!trial || !trial.choices.includes(attempt.selectedWord)) {
          throw new Error(`Invalid listening attempt: ${attempt.trialId}`);
        }
      }

      const attempts = [...uniqueAttempts.values()];
      const correct = attempts.filter((attempt) => trials.get(attempt.trialId)?.audioText === attempt.selectedWord).length;
      const replayCount = attempts.reduce((sum, attempt) => sum + attempt.replayCount, 0);
      const listeningScore = attempts.length === 0 ? 0 : round((correct / attempts.length) * 100);
      const language = await languageProvider.assess({
        transcript: submission.transcript,
        prompt: exercise.speakingPrompt,
        requiredConcepts: exercise.requiredConcepts,
        childAgeBand: submission.childAgeBand,
      });

      const assessedWeight = 0.8;
      const weighted =
        listeningScore * 0.4 +
        language.taskCompletion.score * 0.15 +
        language.content.score * 0.15 +
        language.grammar.score * 0.1;
      const hasRecordableSubmission = Boolean(submission.recording && submission.transcript.trim());
      const status = !hasRecordableSubmission
        ? "needs_retry"
        : language.confidence < 0.55
          ? "needs_review"
          : "scored";

      return practiceScoreSchema.parse({
        id: crypto.randomUUID(),
        exerciseId: exercise.id,
        status,
        overallScore: round(weighted / assessedWeight),
        scoreCoverage: assessedWeight,
        dimensions: {
          listening: {
            score: listeningScore,
            correct,
            total: attempts.length,
            replayCount,
            evidence: `${attempts.length} 道听辨题中答对 ${correct} 道，共重播 ${replayCount} 次。`,
          },
          taskCompletion: language.taskCompletion,
          content: language.content,
          grammar: language.grammar,
          pronunciation: {
            status: "not_assessed",
            score: null,
            evidence: "当前 Demo 尚未接入经过儿童语音校准的音素评测服务，因此不伪造发音分数。",
            provider: null,
          },
        },
        confidence: round(language.confidence * 100) / 100,
        strength: language.strength,
        nextAction: language.nextAction,
        childMessage: status === "needs_retry" ? "录音还没有准备好，我们再试一次。" : "完成啦！你已经在认真听两个不同的声音。",
        parentMessage:
          "总分只覆盖听辨、任务完成、内容与文本语法，不代表发音准确度。请结合录音回放和孩子当下状态判断。",
        provenance: {
          scoringMode: languageProvider.mode,
          rubricVersion: exercise.rubricVersion,
          modelVersion: languageProvider.modelVersion,
          createdAt: new Date().toISOString(),
        },
      });
    },
  };
}
