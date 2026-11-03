import type { AiProvider, KnowledgeMatch, KnowledgeRetriever } from "@growfun/domain";
import { dailyJourneySchema } from "@growfun/domain";
import { localKnowledgeRetriever } from "../knowledge/local-retriever.js";

function allocateMinutes(total: number): [number, number, number, number] {
  const listen = Math.max(1, Math.floor(total * 0.2));
  const contrast = Math.max(1, Math.floor(total * 0.3));
  const produce = Math.max(1, Math.floor(total * 0.3));
  return [listen, contrast, produce, total - listen - contrast - produce];
}

function toEvidence(match: KnowledgeMatch) {
  return {
    knowledgeId: match.knowledgeId,
    title: match.title,
    summary: match.summary,
    sourceTitle: match.sourceTitle,
    sourceUrl: match.sourceUrl,
    score: match.score,
  };
}

export function createMemoryAiProvider(retriever: KnowledgeRetriever): AiProvider {
  return {
    async prepareJourney(input) {
      const matches = await retriever.search({
        childAgeBand: input.childAgeBand,
        goal: input.goal,
        limit: 5,
      });
      const focus = matches.find((match) => match.examples.length > 0) ?? matches[0];

      if (!focus) {
        throw new Error("The pronunciation knowledge base returned no matches.");
      }

      const practiceItems = focus.examples.slice(0, 2);
      const [noticeMinutes, listenMinutes, produceMinutes, reflectMinutes] = allocateMinutes(
        input.minutesAvailable,
      );
      const firstPair = practiceItems[0];
      const pairLabel = firstPair?.contrastWord
        ? `${firstPair.word} / ${firstPair.contrastWord}`
        : firstPair?.word ?? "目标声音";

      const journey = {
        id: crypto.randomUUID(),
        title: `今天练习：${focus.title}`,
        focus: focus.summary,
        steps: [
          {
            title: "只听，不跟读",
            guidance: `点击单词并随机播放 ${pairLabel}。孩子只需要说听到的是第一个还是第二个。先建立声音差异。`,
            minutes: noticeMinutes,
            activityType: "notice" as const,
            practiceItems,
          },
          {
            title: "听辨挑战",
            guidance: "家长改变播放顺序，每组做 3–5 次。答错时直接重播，不提示口型，也不评价孩子。",
            minutes: listenMinutes,
            activityType: "listen" as const,
            practiceItems,
          },
          {
            title: "观察并模仿",
            guidance: `${focus.content} 家长先示范一次，孩子再模仿；一次只调整一个动作。`,
            minutes: produceMinutes,
            activityType: "produce" as const,
            practiceItems,
          },
          {
            title: "交换角色复习",
            guidance: "孩子选择并读一个词，家长来猜。最后请孩子说出自己听到或做到的一个差异。",
            minutes: reflectMinutes,
            activityType: "reflect" as const,
            practiceItems,
          },
        ],
        parentNote:
          "本次 Demo 评估的是听辨和模仿流程，不会自动判断孩子发音是否正确。系统语音只作练习样本，重要结论应在真人教师与真实儿童测试中复核。",
        evidence: matches.slice(0, 3).map(toEvidence),
        review: {
          status: "demo_reviewed" as const,
          checks: ["检索结果来自限定知识库", "练习总时长符合请求", "听辨先于模仿", "资料来源可追溯"],
        },
        source: "memory" as const,
      };

      const parsed = dailyJourneySchema.parse(journey);
      const totalMinutes = parsed.steps.reduce((sum, step) => sum + step.minutes, 0);
      if (totalMinutes !== input.minutesAvailable) {
        throw new Error("Generated journey length does not match the requested duration.");
      }
      return parsed;
    },
  };
}

export const memoryAiProvider = createMemoryAiProvider(localKnowledgeRetriever);
