import { Suspense, lazy, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useBank, resolveIds } from "@/data/useBank";
import { ButtonLink, Card, PageHeader, cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { QuestionCard } from "@/features/practice/QuestionCard";
import { CHAPTER_BY_ID } from "@/config/chapters";
import { formatDurationVi, scoreAttempt } from "@/lib/exam";
import { useExams } from "@/store/examStore";
import type { OptionId } from "@/schemas/mcq";

const ChapterChart = lazy(() => import("./ChapterChart"));

const LETTERS = ["A", "B", "C", "D"] as const;
const DIFF_LABEL = { 1: "Dễ", 2: "Vừa", 3: "Khó" } as const;
const noop = () => {};
const pct = (c: number, t: number) => (t ? Math.round((c / t) * 100) : 0);

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <Card>
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p
        className={cx(
          "text-3xl font-bold tabular-nums",
          tone === "good" ? "text-correct dark:text-green-400" : tone === "bad" ? "text-wrong dark:text-red-400" : "text-navy-900 dark:text-white",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
    </Card>
  );
}

export default function ExamResultPage() {
  const { examId = "", attemptId = "" } = useParams();
  const attempt = useExams((s) => s.attempts.find((a) => a.id === attemptId));
  const bank = useBank();
  const [filter, setFilter] = useState<"wrong" | "all">("wrong");

  const questions = useMemo(
    () => (bank.status === "ready" && attempt ? resolveIds(bank.data.byId, attempt.questionIds) : []),
    [bank, attempt],
  );
  const score = useMemo(() => (attempt ? scoreAttempt(questions, attempt.answers) : null), [questions, attempt]);

  if (!attempt)
    return (
      <>
        <PageHeader title="Không tìm thấy kết quả" subtitle="Lượt thi này không có trong lịch sử trên thiết bị này." />
        <ButtonLink to="/exams">← Về danh sách đề</ButtonLink>
      </>
    );
  if (bank.status !== "ready" || !score) return <p role="status">Đang tải kết quả…</p>;

  const reviewList = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => filter === "all" || attempt.answers[q.id] !== q.correct);

  return (
    <>
      <PageHeader title={`Kết quả: ${attempt.title}`} subtitle={new Date(attempt.finishedAt).toLocaleString("vi-VN")}>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/exams/${examId}`}>{examId === "random" ? "Làm đề ngẫu nhiên mới" : "Làm lại đề này"}</ButtonLink>
          <ButtonLink to="/exams" variant="secondary">
            Danh sách đề
          </ButtonLink>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Điểm" value={`${score.score10}/10`} tone={score.score10 >= 5 ? "good" : "bad"} />
        <Stat label="Tỉ lệ đúng" value={`${score.pct}%`} sub={`${score.correct}/${score.total} câu đúng`} />
        <Stat
          label="Thời gian làm bài"
          value={formatDurationVi(attempt.elapsedSec)}
          sub={attempt.timedOut ? "Hết giờ — bài tự nộp" : undefined}
        />
        <Stat label="Sai / bỏ trống" value={`${score.wrongIds.length} / ${score.unansweredIds.length}`} />
      </div>

      <section aria-labelledby="by-chapter-h" className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <h2 id="by-chapter-h" className="mb-3 font-semibold text-navy-900 dark:text-white">
            Kết quả theo chương
          </h2>
          <Suspense fallback={<div className="h-64" />}>
            <ChapterChart data={score.byChapter} />
          </Suspense>
          <table className="mt-4 w-full text-sm">
            <caption className="sr-only">Số câu đúng theo chương</caption>
            <thead className="text-left text-slate-600 dark:text-slate-400">
              <tr>
                <th scope="col" className="py-1 font-medium">Chương</th>
                <th scope="col" className="py-1 text-right font-medium">Đúng</th>
                <th scope="col" className="py-1 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {score.byChapter.map((c) => (
                <tr key={c.chapter} className="border-t border-slate-200 dark:border-slate-800">
                  <th scope="row" className="py-1 text-left font-normal">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHAPTER_BY_ID[c.chapter].color }} />
                    {c.chapter} · {CHAPTER_BY_ID[c.chapter].shortVi}
                  </th>
                  <td className="py-1 text-right tabular-nums">
                    {c.correct}/{c.total}
                  </td>
                  <td className="py-1 text-right tabular-nums">{pct(c.correct, c.total)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-navy-900 dark:text-white">Theo độ khó</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600 dark:text-slate-400">
              <tr>
                <th scope="col" className="py-1 font-medium">Độ khó</th>
                <th scope="col" className="py-1 text-right font-medium">Đúng</th>
                <th scope="col" className="py-1 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {score.byDifficulty.map((d) => (
                <tr key={d.difficulty} className="border-t border-slate-200 dark:border-slate-800">
                  <th scope="row" className="py-1 text-left font-normal">
                    {DIFF_LABEL[d.difficulty]} ({"●".repeat(d.difficulty)})
                  </th>
                  <td className="py-1 text-right tabular-nums">
                    {d.correct}/{d.total}
                  </td>
                  <td className="py-1 text-right tabular-nums">{pct(d.correct, d.total)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Câu sai đã được thêm vào{" "}
            <Link to="/review" className="underline">
              ngân hàng câu sai
            </Link>{" "}
            để ôn lại.
          </p>
        </Card>
      </section>

      <section aria-labelledby="review-h" className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="review-h" className="text-lg font-semibold text-navy-900 dark:text-white">
            Xem lại bài làm
          </h2>
          <Segmented
            label="Lọc câu hỏi"
            value={filter}
            options={[
              { value: "wrong", label: `Câu sai & bỏ trống (${score.wrongIds.length + score.unansweredIds.length})` },
              { value: "all", label: `Tất cả (${score.total})` },
            ]}
            onChange={setFilter}
          />
        </div>
        {reviewList.length === 0 ? (
          <Card>Không có câu sai — xuất sắc!</Card>
        ) : (
          <ul className="space-y-2">
            {reviewList.map(({ q, i }) => {
              const order = attempt.optionOrder[q.id] ?? (["a", "b", "c", "d"] as OptionId[]);
              const chosen = attempt.answers[q.id];
              const ok = chosen === q.correct;
              const status = chosen === undefined ? "Bỏ trống" : ok ? "Đúng" : `Sai (chọn ${LETTERS[order.indexOf(chosen)]})`;
              return (
                <li key={q.id}>
                  <details className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                      <span className="w-16 shrink-0 whitespace-nowrap font-semibold tabular-nums text-slate-700 dark:text-slate-300">Câu {i + 1}</span>
                      <span
                        className={cx(
                          "w-28 shrink-0 text-sm font-medium",
                          ok ? "text-correct dark:text-green-400" : chosen === undefined ? "text-flag dark:text-amber-400" : "text-wrong dark:text-red-400",
                        )}
                      >
                        {status}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-400">{q.stem}</span>
                      <span aria-hidden className="text-slate-400 transition-transform duration-150 group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                      {chosen === undefined && <p className="mb-2 text-sm font-medium text-flag dark:text-amber-400">Bạn đã bỏ trống câu này.</p>}
                      <QuestionCard question={q} order={order} selected={chosen ?? null} onSelect={noop} reveal index={i} total={score.total} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
