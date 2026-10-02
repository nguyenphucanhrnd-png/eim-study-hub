import { z } from "zod";
import { CHAPTER_IDS } from "@/config/chapters";

export const GlossaryEntrySchema = z.object({
  en: z.string().min(1),
  vi: z.string().min(1),
  chapter: z.enum(CHAPTER_IDS).optional(),
  note: z.string().optional(),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;
export const GlossaryFileSchema = z.array(GlossaryEntrySchema);

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["term", "concept"]),
  chapter: z.enum(CHAPTER_IDS),
  front: z.string().min(1),
  back: z.string().min(1),
  source: z.string().min(1),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;
export const FlashcardsFileSchema = z.array(FlashcardSchema);
