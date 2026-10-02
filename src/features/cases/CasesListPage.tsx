import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { loadCases } from "@/data";
import { useAsync } from "@/lib/useAsync";
import { Badge, Card, PageHeader, cx } from "@/components/ui";
import { CHAPTERS, CHAPTER_BY_ID, type ChapterId } from "@/config/chapters";
import { bestCaseScores, useCases } from "@/store/caseStore";

const DIFF_LABEL = { 1: "Dễ", 2: "Vừa", 3: "Khó" } as const;

function FilterChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
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
      {children}
    </button>
  );
}

export default function CasesListPage() {
  const cases = useAsync(loadCases, []);
  const history = useCases((s) => s.history);
  const drafts = useCases((s) => s.drafts);
  const [chapter, setChapter] = useState<ChapterId | null>(null);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | null>(null);
  const best = bestCaseScores(history);

  const list =
    cases.status === "ready"
      ? cases.data.filter((c) => (!chapter || c.chapters.includes(chapter)) && (!difficulty || c.difficulty === difficulty))
      : [];

  return (
    <>
      <PageHeader
        title="Case study"
        subtitle="Tình huống tiếng Anh: làm từng câu (tự lưu nháp) → nộp để xem đáp án mẫu (EN) → tự chấm theo rubric (VI)."
      />

      <Card className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-sm font-semibold text-slate-700 dark:text-slate-300">Chương</span>
          <FilterChip pressed={chapter === null} onClick={() => setChapter(null)}>
            Tất cả
          </FilterChip>
          {CHAPTERS.map((c) => (
            <FilterChip key={c.id} pressed={chapter === c.id} onClick={() => setChapter(chapter === c.id ? null : c.id)}>
              {c.id}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-sm font-semibold text-slate-700 dark:text-slate-300">Độ khó</span>
          <FilterChip pressed={difficulty === null} onClick={() => setDifficulty(null)}>
            Tất cả
          </FilterChip>
          {([1, 2, 3] as const).map((d) => (
            <FilterChip key={d} pressed={difficulty === d} onClick={() => setDifficulty(difficulty === d ? null : d)}>
              {DIFF_LABEL[d]}
            </FilterChip>
          ))}
        </div>
      </Card>

      {cases.status === "loading" && <p role="status">Đang tải case…</p>}
      {cases.status === "ready" && (
        <>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
            {list.length} / {cases.data.length} case
          </p>
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((c) => {
              const score = best.get(c.id);
              const started = drafts[c.id] && Object.values(drafts[c.id]!).some((t) => t.trim());
              return (
                <li key={c.id}>
                  <Card className="flex h-full flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.chapters.map((ch) => (
                        <span key={ch} className="rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: CHAPTER_BY_ID[ch].color }}>
                          {ch}
                        </span>
                      ))}
                      {c.chapters.length >= 3 && <Badge color="#7c3aed">Tích hợp</Badge>}
                      <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{c.id}</span>
                    </div>
                    <h2 className="font-semibold leading-snug text-slate-900 dark:text-white">
                      <Link to={`/cases/${c.id}`} className="hover:underline">
                        {c.title}
                      </Link>
                    </h2>
                    <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <span>
                        {DIFF_LABEL[c.difficulty]} {"●".repeat(c.difficulty)}
                      </span>
                      <span>~{c.estMinutes} phút</span>
                      <span>{c.tasks.length} câu · 10 điểm</span>
                      {score !== undefined ? (
                        <span className="font-semibold text-slate-900 dark:text-white">Cao nhất {score}/10</span>
                      ) : (
                        started && <span className="text-flag dark:text-amber-400">Đang làm</span>
                      )}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
