import type {
  KnowledgeRetriever,
  LessonGenerationAgent,
  LessonGenerationRequest,
  LessonOrchestrator,
  LessonPlan,
  LessonReviewAgent,
} from "@growfun/domain";
import { lessonPlanSchema } from "@growfun/domain";
import type { LessonHistoryStore } from "./in-memory-lesson-history.js";
import { inspectNovelty, toEvidence, validateLessonDraft } from "./lesson-tools.js";

export type LessonReviewMode = "auto" | "always" | "never";

function workflowEvent(state: LessonPlan["orchestration"]["events"][number]["state"], detail: string) {
  return { state, detail, at: new Date().toISOString() };
}

function isRepairableModelOutputError(error: unknown) {
  return error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError");
}

export function createLessonOrchestrator(options: {
  retriever: KnowledgeRetriever;
  generationAgent: LessonGenerationAgent;
  reviewAgent: LessonReviewAgent;
  history: LessonHistoryStore;
  reviewMode: LessonReviewMode;
}): LessonOrchestrator {
  return {
    async generate(request: LessonGenerationRequest) {
      const workflowId = `workflow-${crypto.randomUUID()}`;
      const events: LessonPlan["orchestration"]["events"] = [
        workflowEvent("received", "已接收并校验课程生成请求"),
      ];
      const evidence = await options.retriever.search({
        childAgeBand: request.childAgeBand,
        goal: request.prompt,
        limit: 5,
      });
      if (evidence.length === 0) throw new Error("No reviewed teaching evidence was retrieved.");
      events.push(workflowEvent("retrieved", `检索到 ${evidence.length} 条审核教学依据`));

      const recentLessons = options.history.recent(request.learnerId, 10);
      let revisionIssues: string[] = [];
      let reviewerTriggered = false;
      let reviewerRequestedRevision = false;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        let draft;
        try {
          draft = await options.generationAgent.generate({ request, evidence, recentLessons, revisionIssues });
        } catch (error) {
          if (attempt === 1 && isRepairableModelOutputError(error)) {
            revisionIssues = ["上一次输出未通过结构化 Schema 校验，请完整重建课程并严格遵循字段契约。"]; 
            events.push(workflowEvent("revising", revisionIssues[0]!));
            continue;
          }
          throw error;
        }
        events.push(workflowEvent("generated", `主生成 Agent 完成第 ${attempt} 次课程草稿`));

        const validation = validateLessonDraft(draft, request, evidence);
        const novelty = inspectNovelty(draft, recentLessons);
        const deterministicIssues = [...validation.issues, ...novelty.issues];
        if (deterministicIssues.length > 0) {
          if (attempt === 2) {
            throw new Error(`Lesson failed deterministic validation: ${deterministicIssues.join(" ")}`);
          }
          revisionIssues = deterministicIssues;
          events.push(workflowEvent("revising", `程序校验要求定向修改：${deterministicIssues.join("；")}`));
          continue;
        }
        events.push(workflowEvent("validated", "结构、答案、时长、依据映射和重复度校验通过"));

        const autoReviewReasons = [
          ...draft.riskFlags,
          ...validation.warnings,
          ...(evidence[0] && evidence[0].score < 0.3 ? ["RAG 首条证据相关度低于自动发布阈值"] : []),
        ];
        const shouldReview =
          options.reviewMode === "always" ||
          (options.reviewMode === "auto" && autoReviewReasons.length > 0);
        let reviewStatus: LessonPlan["orchestration"]["review"]["status"] = "not_required";
        let reviewReasons = ["自动成本策略判定：程序校验充分，本次不调用第二个模型"];

        if (shouldReview) {
          reviewerTriggered = true;
          const review = await options.reviewAgent.review({ request, draft, evidence });
          events.push(workflowEvent("reviewed", `教学审核 Agent 返回 ${review.decision}`));
          if (review.decision === "revise") {
            reviewerRequestedRevision = true;
            if (attempt === 2) throw new Error(`Lesson review failed: ${review.issues.join(" ")}`);
            revisionIssues = review.issues;
            events.push(workflowEvent("revising", `审核 Agent 要求定向修改：${review.issues.join("；")}`));
            continue;
          }
          reviewStatus = reviewerRequestedRevision ? "revised" : "passed";
          reviewReasons = review.strengths;
        }

        events.push(workflowEvent("published", "课程已通过发布门槛并写入学习历史"));
        const lesson = lessonPlanSchema.parse({
          id: `lesson-${crypto.randomUUID()}`,
          version: "1.0.0",
          title: draft.title,
          summary: draft.summary,
          learningObjectives: draft.learningObjectives,
          activities: draft.activities,
          parentNote: draft.parentNote,
          request,
          evidence: evidence.slice(0, 5).map(toEvidence),
          orchestration: {
            workflowId,
            status: "published",
            events,
            generation: {
              source: options.generationAgent.mode,
              modelVersion: options.generationAgent.modelVersion,
              attempts: attempt,
            },
            review: {
              status: reviewStatus,
              source: reviewerTriggered ? options.reviewAgent.mode : null,
              modelVersion: reviewerTriggered ? options.reviewAgent.modelVersion : null,
              reasons: reviewReasons,
            },
            novelty: {
              comparedLessons: novelty.comparedLessons,
              exactDuplicates: novelty.exactDuplicates,
              nearDuplicates: novelty.nearDuplicates,
              intentionalReview: novelty.intentionalReview,
            },
            validationChecks: [
              ...validation.checks,
              "与当前学习历史完成精确及近似查重",
              shouldReview ? "按成本策略完成教学审核 Agent 检查" : "按成本策略跳过非必要模型审核",
            ],
          },
        });
        options.history.save(request.learnerId, lesson);
        return lesson;
      }

      throw new Error("Lesson generation exhausted the maximum of two attempts.");
    },
  };
}

