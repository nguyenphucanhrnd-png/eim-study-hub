import { z } from "zod";
import { OptionIdSchema } from "./mcq";

export const ExamSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  durationMin: z.number().int().positive(),
  questionIds: z.array(z.string()).min(1),
  /** Display order of option ids per question (seeded shuffle from build-exams). */
  optionOrder: z.record(z.string(), z.array(OptionIdSchema).length(4)).optional(),
});
export type Exam = z.infer<typeof ExamSchema>;

export const ExamsFileSchema = z.object({
  seed: z.number().int(),
  generatedFrom: z.string(),
  exams: z.array(ExamSchema),
});
export type ExamsFile = z.infer<typeof ExamsFileSchema>;
