import { z } from "zod";
import { CHAPTER_IDS } from "@/config/chapters";

export const CaseStudySchema = z
  .object({
    id: z.string().regex(/^CASE-C[1-8]-\d{2}$/, "id must look like CASE-C5-03"),
    chapters: z.array(z.enum(CHAPTER_IDS)).min(1),
    title: z.string().min(1),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    estMinutes: z.number().int().positive(),
    scenario: z.string().min(1),
    tasks: z.array(z.object({ id: z.string(), prompt: z.string().min(1), points: z.number().positive() })).min(3),
    modelAnswers: z.array(z.object({ taskId: z.string(), answer: z.string().min(1) })),
    rubric: z.array(
      z.object({
        taskId: z.string(),
        criteria: z.array(z.object({ text: z.string().min(1), points: z.number().positive() })).min(1),
      }),
    ),
    commonMistakes: z.array(z.string().min(1)).min(3),
    sources: z.array(z.string().min(1)).min(1),
  })
  .superRefine((c, ctx) => {
    const total = c.tasks.reduce((s, tk) => s + tk.points, 0);
    if (Math.abs(total - 10) > 1e-9) ctx.addIssue({ code: "custom", message: `task points sum to ${total}, expected 10` });
    for (const tk of c.tasks) {
      if (!c.modelAnswers.some((m) => m.taskId === tk.id))
        ctx.addIssue({ code: "custom", message: `no model answer for task ${tk.id}` });
      const rb = c.rubric.find((r) => r.taskId === tk.id);
      if (!rb) {
        ctx.addIssue({ code: "custom", message: `no rubric for task ${tk.id}` });
        continue;
      }
      const pts = rb.criteria.reduce((s, cr) => s + cr.points, 0);
      if (Math.abs(pts - tk.points) > 1e-9)
        ctx.addIssue({ code: "custom", message: `rubric for ${tk.id} sums to ${pts}, task is worth ${tk.points}` });
    }
  });
export type CaseStudy = z.infer<typeof CaseStudySchema>;
export const CasesFileSchema = z.array(CaseStudySchema);
