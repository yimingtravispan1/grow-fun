import type { LanguageAssessmentProvider } from "@growfun/domain";

function words(value: string) {
  return value.toLocaleLowerCase().match(/[a-z']+/g) ?? [];
}

export const memoryLanguageAssessmentProvider: LanguageAssessmentProvider = {
  mode: "memory",
  modelVersion: null,

  async assess(input) {
    const transcript = input.transcript.trim();
    const transcriptWords = words(transcript);
    const normalizedWords = new Set(transcriptWords);
    const matchedConcepts = input.requiredConcepts.filter((concept) =>
      normalizedWords.has(concept.toLocaleLowerCase()),
    );
    const conceptRatio = matchedConcepts.length / input.requiredConcepts.length;
    const hasSentenceShape = transcriptWords.length >= 4;
    const issues: Array<{ original: string; suggestion: string; explanation: string }> = [];

    if (transcript && transcript[0] !== transcript[0]?.toLocaleUpperCase()) {
      issues.push({
        original: transcript,
        suggestion: `${transcript[0]?.toLocaleUpperCase()}${transcript.slice(1)}`,
        explanation: "英文句子通常以大写字母开头。",
      });
    }

    if (transcript && !/[.!?]$/.test(transcript)) {
      issues.push({
        original: transcript,
        suggestion: `${transcript}.`,
        explanation: "完整句子可以用句号、问号或感叹号结束。",
      });
    }

    const taskScore = transcriptWords.length === 0 ? 0 : hasSentenceShape ? 95 : 60;
    const contentScore = Math.round(conceptRatio * 100);
    const grammarScore = transcriptWords.length === 0 ? 0 : Math.max(45, 100 - issues.length * 15);
    const confidence = transcriptWords.length === 0 ? 0.2 : 0.72;

    return {
      taskCompletion: {
        score: taskScore,
        evidence: hasSentenceShape ? "提交了包含多个单词的完整表达。" : "表达过短，暂时无法确认是否完成任务。",
      },
      content: {
        score: contentScore,
        evidence:
          matchedConcepts.length === input.requiredConcepts.length
            ? `表达中包含目标词：${matchedConcepts.join("、")}。`
            : `检测到 ${matchedConcepts.length}/${input.requiredConcepts.length} 个目标词。`,
      },
      grammar: {
        score: grammarScore,
        evidence: issues.length === 0 ? "本地规则没有发现基础书写问题。" : `发现 ${issues.length} 个基础书写提示。`,
        issues,
      },
      confidence,
      strength:
        matchedConcepts.length > 0 ? `已经在表达中使用了 ${matchedConcepts.join(" 和 ")}。` : "已经完成录音尝试。",
      nextAction:
        matchedConcepts.length === input.requiredConcepts.length
          ? "再听一次两个目标词，然后用更自然的节奏重说句子。"
          : `下一次尝试同时加入 ${input.requiredConcepts.join(" 和 ")}。`,
    };
  },
};
