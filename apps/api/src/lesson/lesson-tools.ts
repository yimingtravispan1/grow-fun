import type {
  Evidence,
  KnowledgeMatch,
  LessonDraft,
  LessonGenerationRequest,
  RecentLessonSummary,
} from "@growfun/domain";

export type DraftValidationReport = {
  issues: string[];
  warnings: string[];
  checks: string[];
};

export type NoveltyReport = {
  comparedLessons: number;
  exactDuplicates: number;
  nearDuplicates: number;
  intentionalReview: boolean;
  issues: string[];
};

export function toEvidence(match: KnowledgeMatch): Evidence {
  return {
    knowledgeId: match.knowledgeId,
    title: match.title,
    summary: match.summary,
    sourceTitle: match.sourceTitle,
    sourceUrl: match.sourceUrl,
    score: match.score,
  };
}

export function validateLessonDraft(
  draft: LessonDraft,
  request: LessonGenerationRequest,
  evidence: KnowledgeMatch[],
): DraftValidationReport {
  const issues: string[] = [];
  const warnings: string[] = [];
  const evidenceIds = new Set(evidence.map(({ knowledgeId }) => knowledgeId));
  const activityTypes = new Set(draft.activities.map(({ type }) => type));
  const totalMinutes = draft.activities.reduce((sum, activity) => sum + activity.durationMinutes, 0);

  if (draft.activities.length !== request.activityCount) {
    issues.push(`需要恰好生成 ${request.activityCount} 个练习，当前为 ${draft.activities.length} 个。`);
  }
  if (draft.activities.length >= 3 && activityTypes.size < 2) {
    issues.push("三个及以上练习必须至少覆盖两种练习类型。 ");
  }
  if (totalMinutes > request.minutesAvailable) {
    issues.push(`练习总时长 ${totalMinutes} 分钟超过可用的 ${request.minutesAvailable} 分钟。`);
  }

  for (const [index, activity] of draft.activities.entries()) {
    const unknownEvidence = activity.evidenceIds.filter((id) => !evidenceIds.has(id));
    if (unknownEvidence.length > 0) {
      issues.push(`第 ${index + 1} 个练习引用了未检索到的依据：${unknownEvidence.join("、")}。`);
    }
    if (activity.type === "guided_speaking" && activity.languageSupport.length === 0) {
      warnings.push(`第 ${index + 1} 个口语练习缺少语言支架。`);
    }
    if (activity.type !== "guided_speaking" && new Set(activity.choices).size !== activity.choices.length) {
      issues.push(`第 ${index + 1} 个练习包含重复选项。`);
    }
  }

  return {
    issues,
    warnings,
    checks: [
      "练习数量与用户要求一致",
      "课程时长未超过可用时间",
      "三个及以上练习至少覆盖两种题型",
      "封闭题答案属于给定选项",
      "每道练习都映射到本次检索的教材依据",
      "所有内容通过领域 Schema 校验",
    ],
  };
}

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim();
}

function activityFingerprint(activity: LessonDraft["activities"][number]) {
  return normalized(`${activity.type}|${activity.stimulus}|${activity.question}|${activity.answer}`);
}

function characterNgrams(value: string, size = 3) {
  const compact = normalized(value);
  if (compact.length <= size) return new Set([compact]);
  return new Set(Array.from({ length: compact.length - size + 1 }, (_, index) => compact.slice(index, index + size)));
}

function jaccard(left: Set<string>, right: Set<string>) {
  const intersection = [...left].filter((item) => right.has(item)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 1 : intersection / union;
}

export function inspectNovelty(draft: LessonDraft, recentLessons: RecentLessonSummary[]): NoveltyReport {
  const current = draft.activities.map(activityFingerprint);
  const previous = recentLessons.flatMap((lesson) => lesson.activities.map(activityFingerprint));
  let exactDuplicates = 0;
  let nearDuplicates = 0;

  for (const [index, fingerprint] of current.entries()) {
    const otherCurrent = current.slice(0, index);
    if (otherCurrent.includes(fingerprint) || previous.includes(fingerprint)) {
      exactDuplicates += 1;
      continue;
    }
    const grams = characterNgrams(fingerprint);
    if ([...otherCurrent, ...previous].some((candidate) => jaccard(grams, characterNgrams(candidate)) >= 0.88)) {
      nearDuplicates += 1;
    }
  }

  const issues: string[] = [];
  if (exactDuplicates > 0) issues.push(`发现 ${exactDuplicates} 道完全重复练习，请更换内容和答案。`);
  if (nearDuplicates > 0) issues.push(`发现 ${nearDuplicates} 道高度相似练习，请更换情境或认知任务。`);

  return {
    comparedLessons: recentLessons.length,
    exactDuplicates,
    nearDuplicates,
    intentionalReview: false,
    issues,
  };
}

