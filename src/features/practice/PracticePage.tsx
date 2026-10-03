import { useId, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useBank } from "@/data/useBank";
import { Button, Card, PageHeader, cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { CHAPTERS, CHAPTER_BY_ID, type ChapterId } from "@/config/chapters";
import { DIFFICULTIES, type Difficulty } from "@/config/blueprint";
import { createRng, shuffle } from "@/lib/rng";
import { useProgress } from "@/store/progressStore";
import type { MCQ } from "@/schemas/mcq";
import { PracticeSession } from "./PracticeSession";
import { filterQuestions, type PracticeFilter, type PracticeMode } from "./filter";

const COUNTS = ["10", "20", "30"] as const;
const DIFF_LABEL: Record<Difficulty, string> = { 1: "Dễ", 2: "Vừa", 3: "Khó" };
const MODES: { value: PracticeMode; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "new", label: "Chưa làm" },
  { value: "wrong", label: "Đang sai" },
];

function Chip({ pressed, onClick, children, color }: { pressed: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-1 text-sm font-medium transition-colors duration-150",
        pressed
          ? "border-navy-700 bg-navy-700 text-white dark:border-navy-300 dark:bg-navy-300 dark:text-navy-950"
          : "border-slate-300 text-slate-700 hover:border-navy-400 dark:border-slate-700 dark:text-slate-300",
      )}
    >
      {color && <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  );
}

function initialFilter(params: URLSearchParams): PracticeFilter {
  const chapters = (params.get("chapter") ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c): c is ChapterId => c in CHAPTER_BY_ID);
  const topic = params.get("topic");
  const mode = params.get("mode");
  // ?topic= alone (deep links from diagrams): the chapter is derived from the topic.
  if (chapters.length === 0 && topic) {
    const owner = CHAPTERS.find((c) => c.topics.some((t) => t.id === topic));
    if (owner) chapters.push(owner.id);
  }
  return {
    chapters,
    topic: chapters.length === 1 && topic && CHAPTER_BY_ID[chapters[0]!].topics.some((t) => t.id === topic) ? topic : null,
    difficulties: [],
    mode: mode === "new" || mode === "wrong" ? mode : "all",
  };
}

export default function PracticePage() {
  const [params] = useSearchParams();
  const bank = useBank();
  const stats = useProgress((s) => s.stats);
  const wrongBank = useProgress((s) => s.wrongBank);
  const [filter, setFilter] = useState<PracticeFilter>(() => initialFilter(params));
  const [count, setCount] = useState<(typeof COUNTS)[number]>("10");
  const [session, setSession] = useState<{ key: number; questions: MCQ[] } | null>(null);
  const topicId = useId();

  const matching = useMemo(
    () => (bank.status === "ready" ? filterQuestions(bank.data.all, filter, stats, wrongBank) : []),
    [bank, filter, stats, wrongBank],
  );

  // Re-filter against the latest progress so "Chưa làm"/"Đang sai" reflect answers from the previous set.
  const start = () => {
    if (bank.status !== "ready") return;
    const { stats: st, wrongBank: wb } = useProgress.getState();
    const seed = Date.now();
    const pool = filterQuestions(bank.data.all, filter, st, wb);
    if (pool.length === 0) return setSession(null);
    setSession({ key: seed, questions: shuffle(pool, createRng(seed)).slice(0, Number(count)) });
  };

  const toggleChapter = (c: ChapterId) =>
    setFilter((f) => {
      const chapters = f.chapters.includes(c) ? f.chapters.filter((x) => x !== c) : [...f.chapters, c];
      return { ...f, chapters, topic: null };
    });
  const toggleDifficulty = (d: Difficulty) =>
    setFilter((f) => ({ ...f, difficulties: f.difficulties.includes(d) ? f.difficulties.filter((x) => x !== d) : [...f.difficulties, d] }));

  const single = filter.chapters.length === 1 ? CHAPTER_BY_ID[filter.chapters[0]!] : null;

  return (
    <>
      <PageHeader title="Luyện trắc nghiệm" subtitle="Chọn bộ lọc, làm bài với phản hồi ngay lập tức và giải thích đầy đủ cho từng phương án." />

      {session ? (
        <PracticeSession key={session.key} questions={session.questions} onExit={() => setSession(null)} onRestart={start} />
      ) : (
        <Card className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Chương</legend>
            <div className="flex flex-wrap gap-2">
              <Chip pressed={filter.chapters.length === 0} onClick={() => setFilter((f) => ({ ...f, chapters: [], topic: null }))}>
                Tất cả
              </Chip>
              {CHAPTERS.map((c) => (
                <Chip key={c.id} pressed={filter.chapters.includes(c.id)} onClick={() => toggleChapter(c.id)} color={c.color}>
                  {c.id} · {c.shortVi}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={topicId} className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Chủ đề
            </label>
            <select
              id={topicId}
              disabled={!single}
              value={filter.topic ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, topic: e.target.value || null }))}
              className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:[color-scheme:dark]"
            >
              <option value="">{single ? "Tất cả chủ đề của chương" : "Chọn đúng 1 chương để lọc theo chủ đề"}</option>
              {single?.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Độ khó</legend>
            <div className="flex flex-wrap gap-2">
              <Chip pressed={filter.difficulties.length === 0} onClick={() => setFilter((f) => ({ ...f, difficulties: [] }))}>
                Tất cả
              </Chip>
              {DIFFICULTIES.map((d) => (
                <Chip key={d} pressed={filter.difficulties.includes(d)} onClick={() => toggleDifficulty(d)}>
                  {DIFF_LABEL[d]} {"●".repeat(d)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Câu hỏi</p>
              <Segmented label="Câu hỏi" value={filter.mode} options={MODES} onChange={(mode) => setFilter((f) => ({ ...f, mode }))} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Số câu</p>
              <Segmented label="Số câu" value={count} options={COUNTS.map((c) => ({ value: c, label: `${c} câu` }))} onChange={setCount} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button onClick={start} disabled={bank.status !== "ready" || matching.length === 0}>
              Bắt đầu luyện
            </Button>
            <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
              {bank.status !== "ready"
                ? "Đang tải ngân hàng câu hỏi…"
                : matching.length === 0
                  ? "Không có câu nào khớp bộ lọc."
                  : `${matching.length} câu phù hợp${matching.length < Number(count) ? ` — sẽ luyện cả ${matching.length} câu` : ""}.`}
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
