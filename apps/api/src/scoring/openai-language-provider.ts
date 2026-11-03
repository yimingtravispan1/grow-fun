import type { LanguageAssessment, LanguageAssessmentProvider } from "@growfun/domain";
import OpenAI from "openai";
import { z } from "zod";

const assessmentSchema = z.object({
  taskCompletion: z.object({ score: z.number().min(0).max(100), evidence: z.string().min(1) }),
  content: z.object({ score: z.number().min(0).max(100), evidence: z.string().min(1) }),
  grammar: z.object({
    score: z.number().min(0).max(100),
    evidence: z.string().min(1),
    issues: z
      .array(z.object({ original: z.string(), suggestion: z.string(), explanation: z.string().min(1) }))
      .max(5),
  }),
  confidence: z.number().min(0).max(1),
  strength: z.string().min(1),
  nextAction: z.string().min(1),
});

export function createOpenAiLanguageAssessmentProvider(model: string): LanguageAssessmentProvider {
  const client = new OpenAI();

  return {
    mode: "openai",
    modelVersion: model,

    async assess(input): Promise<LanguageAssessment> {
      const response = await client.responses.create({
        model,
        input: [
          {
            role: "system",
            content:
              "你是 GrowFun 的儿童英语形成性评价器。只评价转写文本的任务完成度、内容和基础语法，不评价发音。使用鼓励、具体且适龄的中文反馈。口音不是错误；不要诊断语言或发育问题。如果转写为空或与任务无关，降低置信度并明确说明。只返回指定 JSON。",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "growfun_language_assessment",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["taskCompletion", "content", "grammar", "confidence", "strength", "nextAction"],
              properties: {
                taskCompletion: {
                  type: "object",
                  additionalProperties: false,
                  required: ["score", "evidence"],
                  properties: { score: { type: "number", minimum: 0, maximum: 100 }, evidence: { type: "string" } },
                },
                content: {
                  type: "object",
                  additionalProperties: false,
                  required: ["score", "evidence"],
                  properties: { score: { type: "number", minimum: 0, maximum: 100 }, evidence: { type: "string" } },
                },
                grammar: {
                  type: "object",
                  additionalProperties: false,
                  required: ["score", "evidence", "issues"],
                  properties: {
                    score: { type: "number", minimum: 0, maximum: 100 },
                    evidence: { type: "string" },
                    issues: {
                      type: "array",
                      maxItems: 5,
                      items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["original", "suggestion", "explanation"],
                        properties: {
                          original: { type: "string" },
                          suggestion: { type: "string" },
                          explanation: { type: "string" },
                        },
                      },
                    },
                  },
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                strength: { type: "string" },
                nextAction: { type: "string" },
              },
            },
          },
        },
      });

      return assessmentSchema.parse(JSON.parse(response.output_text));
    },
  };
}
