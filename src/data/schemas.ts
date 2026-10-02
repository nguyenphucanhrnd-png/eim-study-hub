/** Dev-only: schemas used by the lazy data loaders (imported dynamically so zod stays out of production bundles). */
import { McqFileSchema } from "@/schemas/mcq";
import { ExamsFileSchema } from "@/schemas/exam";
import { CasesFileSchema } from "@/schemas/case";
import { FlashcardsFileSchema, GlossaryFileSchema } from "@/schemas/glossary";

export const DATA_SCHEMAS = {
  questions: McqFileSchema,
  exams: ExamsFileSchema,
  cases: CasesFileSchema,
  glossary: GlossaryFileSchema,
  flashcards: FlashcardsFileSchema,
};
export type DataSchemaKey = keyof typeof DATA_SCHEMAS;
