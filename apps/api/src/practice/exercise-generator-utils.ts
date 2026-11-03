import type {
  Evidence,
  KnowledgeMatch,
  PracticeExercise,
  PracticeGenerationRequest,
} from "@growfun/domain";
import { practiceExerciseSchema } from "@growfun/domain";

export type ApprovedPair = {
  word: string;
  ipa: string;
  contrastWord: string;
  contrastIpa: string;
  knowledge: KnowledgeMatch;
};

export function selectApprovedPair(matches: KnowledgeMatch[]): ApprovedPair {
  for (const knowledge of matches) {
    for (const example of knowledge.examples) {
      if (example.contrastWord && example.contrastIpa) {
        return {
          word: example.word,
          ipa: example.ipa,
          contrastWord: example.contrastWord,
          contrastIpa: example.contrastIpa,
          knowledge,
        };
      }
    }
  }
  throw new Error("No reviewed minimal pair was found for this learning goal.");
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex]!, result[index]!];
  }
  return result;
}

function toEvidence(match: KnowledgeMatch): Evidence {
  return {
    knowledgeId: match.knowledgeId,
    title: match.title,
    summary: match.summary,
    sourceTitle: match.sourceTitle,
    sourceUrl: match.sourceUrl,
    score: match.score,
  };
}

export function buildExercise(input: {
  request: PracticeGenerationRequest;
  pair: ApprovedPair;
  matches: KnowledgeMatch[];
  source: "memory" | "openai" | "open_source";
  modelVersion: string | null;
  copy: {
    title: string;
    targetDescription: string;
    speakingPrompt: string;
    suggestedSentence: string;
  };
}): PracticeExercise {
  const { request, pair, matches, copy, source, modelVersion } = input;
  const audioSequence = shuffled([
    ...Array.from({ length: request.trialCount / 2 }, () => pair.word),
    ...Array.from({ length: request.trialCount / 2 }, () => pair.contrastWord),
  ]);
  const normalizedSentence = copy.suggestedSentence.toLocaleLowerCase();
  if (![pair.word, pair.contrastWord].every((word) => normalizedSentence.includes(word.toLocaleLowerCase()))) {
    throw new Error("The generated example sentence must contain both approved target words.");
  }

  return practiceExerciseSchema.parse({
    id: `practice-${crypto.randomUUID()}`,
    version: "1.0.0",
    title: copy.title,
    childAgeBand: request.childAgeBand,
    accent: request.accent,
    targetLabel: pair.knowledge.title,
    targetDescription: copy.targetDescription,
    words: [
      { word: pair.word, ipa: pair.ipa },
      { word: pair.contrastWord, ipa: pair.contrastIpa },
    ],
    listeningTrials: audioSequence.map((audioText, index) => ({
      id: `trial-${index + 1}`,
      audioText,
      choices: [pair.word, pair.contrastWord],
    })),
    speakingPrompt: copy.speakingPrompt,
    suggestedSentence: copy.suggestedSentence,
    requiredConcepts: [pair.word, pair.contrastWord],
    rubricVersion: "growfun-speaking-rubric-0.1",
    generation: {
      source,
      modelVersion,
      goal: request.goal,
      evidence: matches.slice(0, 3).map(toEvidence),
      validationChecks: [
        "词对与 IPA 来自审核知识库",
        "两个目标词出现次数相同",
        "每道题的音频与选项属于目标词对",
        "示例句包含两个目标词",
        "生成结果通过领域 Schema 校验",
      ],
      generatedAt: new Date().toISOString(),
    },
  });
}
