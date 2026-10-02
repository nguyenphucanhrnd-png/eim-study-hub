import type { ChapterId } from "@/config/chapters";
import { CHAPTERS } from "@/config/chapters";
import type { MCQ } from "@/schemas/mcq";
import type { ExamsFile } from "@/schemas/exam";
import type { CaseStudy } from "@/schemas/case";
import type { Flashcard, GlossaryEntry } from "@/schemas/glossary";
import type { DataSchemaKey } from "./schemas";

/**
 * Lazy JSON loaders (each chapter bank is its own chunk). In dev, every file is re-validated
 * with Zod so content mistakes surface immediately; production trusts `npm run validate:bank`.
 */
const questionFiles = import.meta.glob<unknown>("./questions/c0*.json", { import: "default" });
const theoryFiles = import.meta.glob<string>("../content/theory/c0*.md", { query: "?raw", import: "default" });

async function checked<T>(key: DataSchemaKey, data: unknown, label: string): Promise<T> {
  if (!import.meta.env.DEV) return data as T;
  const { DATA_SCHEMAS } = await import("./schemas");
  const res = DATA_SCHEMAS[key].safeParse(data);
  if (!res.success) {
    console.error(`[data] ${label} failed validation`, res.error.issues);
    throw new Error(`Invalid data in ${label}`);
  }
  return res.data as T;
}

const fileKey = (ch: ChapterId) => `0${ch.slice(1)}`;

const questionCache = new Map<ChapterId, Promise<MCQ[]>>();

export function loadChapterQuestions(ch: ChapterId): Promise<MCQ[]> {
  let p = questionCache.get(ch);
  if (!p) {
    const loader = questionFiles[`./questions/c${fileKey(ch)}.json`];
    p = loader ? loader().then((d) => checked<MCQ[]>("questions", d, `questions/${ch}`)) : Promise.resolve([]);
    questionCache.set(ch, p);
  }
  return p;
}

/**
 * Resolves once the page is visible and the browser is idle: after the current frame is painted, after the
 * window "load" event (initial visit) and in an idle period. Large data downloads (the question bank) start
 * here so they do not compete with first paint.
 */
export function afterPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return resolve();
    const idle = () => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => resolve(), { timeout: 500 });
      else setTimeout(resolve, 50);
    };
    const afterLoad = () => (document.readyState === "complete" ? idle() : window.addEventListener("load", idle, { once: true }));
    window.requestAnimationFrame(() => window.setTimeout(afterLoad, 0));
  });
}

/** The whole bank, loaded after first paint (see afterPaint). */
export const loadAllQuestionsAfterPaint = (): Promise<MCQ[]> => afterPaint().then(loadAllQuestions);

export async function loadAllQuestions(): Promise<MCQ[]> {
  const parts = await Promise.all(CHAPTERS.map((c) => loadChapterQuestions(c.id)));
  return parts.flat();
}

export async function loadTheory(ch: ChapterId): Promise<string | null> {
  const loader = theoryFiles[`../content/theory/c${fileKey(ch)}.md`];
  return loader ? loader() : null;
}

export async function loadExams(): Promise<ExamsFile> {
  const d = await import("./exams/exams.json");
  return checked<ExamsFile>("exams", d.default, "exams.json");
}

export async function loadCases(): Promise<CaseStudy[]> {
  const d = await import("./cases/cases.json");
  return checked<CaseStudy[]>("cases", d.default, "cases.json");
}

export async function loadGlossary(): Promise<GlossaryEntry[]> {
  const d = await import("./glossary.json");
  return checked<GlossaryEntry[]>("glossary", d.default, "glossary.json");
}

export async function loadFlashcards(): Promise<Flashcard[]> {
  const d = await import("./flashcards.json");
  return checked<Flashcard[]>("flashcards", d.default, "flashcards.json");
}
