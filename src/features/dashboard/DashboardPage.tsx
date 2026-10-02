import { Link } from "react-router-dom";
import { CHAPTERS, CHAPTER_BY_ID, topicLabel } from "@/config/chapters";
import { loadAllQuestionsAfterPaint } from "@/data";
import { useAsync } from "@/lib/useAsync";
import { useProgress } from "@/store/progressStore";
import { ButtonLink, Card, PageHeader, ProgressBar } from "@/components/ui";
import type { MCQ } from "@/schemas/mcq";
import type { QuestionStat } from "@/lib/progress";
import { weakTopics } from "@/lib/insights";
import { useExams } from "@/store/examStore";

function chapterProgress(questions: MCQ[], stats: Record<string, QuestionStat>) {
  const done = questions.filter((q) => stats[q.id]);
  const attempts = done.reduce((s, q) => s + (stats[q.id]?.attempts ?? 0), 0);
  const correct = done.reduce((s, q) => s + (stats[q.id]?.correct ?? 0), 0);
  return {
    total: questions.length,
    donePct: questions.length ? (done.length / questions.length) * 100 : 0,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
  };
}

export default function DashboardPage() {
  const bank = useAsync(loadAllQuestionsAfterPaint, []);
  const stats = useProgress((s) => s.stats);
  const questions = bank.status === "ready" ? bank.data : [];
  const attempts = useExams((s) => s.attempts);
  const weak = weakTopics(questions, stats);
  const best = attempts.reduce<number | null>((m, a) => (m === null || a.score10 > m ? a.score10 : m), null);

  return (
    <>
      <PageHeader
        title="Tổng quan"
        subtitle="Ôn tập môn Quản trị Xuất Nhập khẩu (Export & Import Management) cho kỳ thi cuối kỳ."
      />

      <div className="mb-8 flex flex-wrap gap-3">
        <ButtonLink to="/learn/c1">Tiếp tục học</ButtonLink>
        <ButtonLink to="/practice" variant="secondary">
          Luyện ngẫu nhiên
        </ButtonLink>
        <ButtonLink to="/exams" variant="secondary">
          Làm đề thi thử
        </ButtonLink>
        <ButtonLink to="/review" variant="secondary">
          Ôn câu sai
        </ButtonLink>
      </div>

      <section aria-labelledby="chapters-h">
        <h2 id="chapters-h" className="mb-3 text-lg font-semibold text-navy-900 dark:text-white">
          Tiến độ theo chương
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CHAPTERS.map((c) => {
            const p = chapterProgress(
              questions.filter((q) => q.chapter === c.id),
              stats,
            );
            return (
              <Card key={c.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="inline-flex h-8 w-10 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.id}
                  </span>
                  <Link to={`/learn/${c.slug}`} className="font-semibold leading-snug text-slate-800 hover:underline dark:text-slate-100">
                    {c.titleVi}
                  </Link>
                </div>
                <ProgressBar value={p.donePct} color={c.color} label={`${c.id}: đã làm ${Math.round(p.donePct)}% câu hỏi`} />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {p.total === 0 ? "Chưa có câu hỏi" : `${Math.round(p.donePct)}% / ${p.total} câu`}
                  {p.accuracy !== null && ` · Đúng ${p.accuracy}%`}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold text-navy-900 dark:text-white">Chủ đề yếu</h2>
          {weak.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Top 5 chủ đề có tỉ lệ đúng thấp nhất (tối thiểu 5 lượt làm) sẽ hiện ở đây khi bạn luyện tập.
            </p>
          ) : (
            <ol className="space-y-2">
              {weak.map((t) => (
                <li key={`${t.chapter}/${t.topic}`} className="flex items-center gap-3">
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: CHAPTER_BY_ID[t.chapter].color }}>
                    {t.chapter}
                  </span>
                  <Link to={`/practice?chapter=${t.chapter}&topic=${t.topic}`} className="min-w-0 flex-1 truncate text-slate-800 hover:underline dark:text-slate-200">
                    {topicLabel(t.chapter, t.topic)}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums text-wrong dark:text-red-400" title={`${t.correct}/${t.attempts} lượt đúng`}>
                    {t.accuracy}%
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold text-navy-900 dark:text-white">Lịch sử thi thử</h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Chưa có lượt thi nào.</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                {attempts.length} lượt · Cao nhất <strong className="text-slate-900 dark:text-white">{best}/10</strong>
              </p>
              <ul className="space-y-1.5">
                {attempts.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 text-sm">
                    <Link to={`/exams/${a.examId}/result/${a.id}`} className="min-w-0 flex-1 truncate text-slate-800 hover:underline dark:text-slate-200">
                      {a.title}
                    </Link>
                    <span className="shrink-0 text-slate-500 tabular-nums dark:text-slate-400">{new Date(a.finishedAt).toLocaleDateString("vi-VN")}</span>
                    <span className="w-12 shrink-0 text-right font-semibold tabular-nums">{a.score10}/10</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
