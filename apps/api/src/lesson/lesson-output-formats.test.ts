import { lessonReviewResultSchema } from "@growfun/domain";
import { describe, expect, it } from "vitest";
import { lessonDraftTextFormat, lessonReviewTextFormat } from "./lesson-output-formats.js";

type JsonSchemaObject = {
  properties?: Record<string, JsonSchemaObject>;
  items?: JsonSchemaObject;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
};

describe("lesson structured-output formats", () => {
  it("derives review limits from the Zod schema", () => {
    const schema = lessonReviewTextFormat.schema as JsonSchemaObject;

    expect(schema.properties?.issues?.maxItems).toBe(8);
    expect(schema.properties?.strengths?.maxItems).toBe(5);
    expect(schema.properties?.strengths?.items?.maxLength).toBe(240);

    expect(
      lessonReviewResultSchema.safeParse({
        decision: "pass",
        issues: [],
        strengths: ["1", "2", "3", "4", "5", "6"],
      }).success,
    ).toBe(false);
  });

  it("derives lesson activity limits from the Zod schema", () => {
    const schema = lessonDraftTextFormat.schema as JsonSchemaObject;
    const activities = schema.properties?.activities;

    expect(activities?.minItems).toBe(2);
    expect(activities?.maxItems).toBe(5);
    expect(activities?.items?.properties?.choices?.maxItems).toBe(4);
    expect(activities?.items?.properties?.evidenceIds?.maxItems).toBe(5);
  });
});
