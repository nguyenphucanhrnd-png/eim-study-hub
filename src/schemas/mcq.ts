import { z } from "zod";
import { CHAPTER_IDS, isTopicOf } from "@/config/chapters";

import { OPTION_IDS } from "./constants";

export { OPTION_IDS };
export const OptionIdSchema = z.enum(OPTION_IDS);
export type OptionId = z.infer<typeof OptionIdSchema>;

export const CALC_KINDS = [
  "revenue", // quantity × price
  "gross-profit", // revenue − cogs
  "gross-margin", // (revenue − cogs) / revenue × 100
  "fx-value", // amount × rate
  "fx-gain-loss", // amount × (rateAtPayment − rateAtContract)
  "insured-amount", // value × percent / 100
  "tolerance-min", // quantity × (1 − percent / 100)
  "tolerance-max", // quantity × (1 + percent / 100)
] as const;
export type CalcKind = (typeof CALC_KINDS)[number];

/** Inputs of a calculation question, re-computed by `validate:bank`. */
export const CalcSchema = z.object({
  kind: z.enum(CALC_KINDS),
  inputs: z.record(z.string(), z.number()),
  expected: z.number(),
});
export type Calc = z.infer<typeof CalcSchema>;

export const ExplanationSchema = z.object({
  summary: z.string().min(1),
  whyCorrect: z.string().min(1),
  whyWrong: z.object({
    a: z.string().min(1).optional(),
    b: z.string().min(1).optional(),
    c: z.string().min(1).optional(),
    d: z.string().min(1).optional(),
  }),
  source: z.string().min(1, "source must not be empty"),
  extNote: z.string().min(1).optional(),
  trap: z.string().min(1).optional(),
});

export const McqSchema = z
  .object({
    id: z.string().regex(/^C[1-8]-[a-z0-9-]+-\d{3}$/, "id must look like C5-lc-dates-007"),
    chapter: z.enum(CHAPTER_IDS),
    topic: z.string().min(1),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    cognitive: z.enum(["remember", "understand", "apply", "analyze"]),
    stem: z.string().min(10),
    options: z
      .array(z.object({ id: OptionIdSchema, text: z.string().min(1) }))
      .length(4, "exactly 4 options"),
    correct: OptionIdSchema,
    lockOrder: z.boolean().optional(),
    explanation: ExplanationSchema,
    tags: z.array(z.string()),
    calc: CalcSchema.optional(),
  })
  .superRefine((q, ctx) => {
    const ids = q.options.map((o) => o.id);
    if (new Set(ids).size !== 4) ctx.addIssue({ code: "custom", message: "option ids must be a,b,c,d (unique)" });
    if (!ids.includes(q.correct)) ctx.addIssue({ code: "custom", message: "correct is not among the options" });
    if (!isTopicOf(q.chapter, q.topic)) ctx.addIssue({ code: "custom", message: `topic "${q.topic}" not in ${q.chapter}` });
    if (!q.id.startsWith(`${q.chapter}-${q.topic}-`))
      ctx.addIssue({ code: "custom", message: `id should start with "${q.chapter}-${q.topic}-"` });
    for (const o of ids) {
      if (o !== q.correct && !q.explanation.whyWrong[o])
        ctx.addIssue({ code: "custom", message: `missing whyWrong for distractor "${o}"` });
    }
    if (q.explanation.whyWrong[q.correct])
      ctx.addIssue({ code: "custom", message: "whyWrong must not contain the correct option" });
  });

export type MCQ = z.infer<typeof McqSchema>;
export const McqFileSchema = z.array(McqSchema);
