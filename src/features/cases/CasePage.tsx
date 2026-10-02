import { useId, useState } from "react";
import { useParams } from "react-router-dom";
import { loadCases } from "@/data";
import { useAsync } from "@/lib/useAsync";
import { Button, ButtonLink, Card, PageHeader, cx } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Markdown } from "@/components/ui/Markdown";
import { CHAPTER_BY_ID } from "@/config/chapters";
import { caseScore } from "@/lib/caseScore";
import type { CaseStudy } from "@/schemas/case";
import { bestCaseScores, useCases } from "@/store/caseStore";

const DIFF_LABEL = { 1: "Dễ", 2: "Vừa", 3: "Khó" } as const;
const NO_TEXT: Record<string, string> = {};

function TaskBlock({ c, index, revealed }: { c: CaseStudy; index: number; revealed: boolean }) {
  const task = c.tasks[index]!;
  const id = useId();
  const draft = useCases((s) => s.drafts[c.id]?.[task.id] ?? "");
  const checks = useCases((s) => s.checks[c.id]?.[task.id]);
  const setDraft = useCases((s) => s.setDraft);
  const toggleCheck = useCases((s) => s.toggleCheck);
  const model = c.modelAnswers.find((m) => m.taskId === task.id)?.answer ?? "";
  const criteria = c.rubric.find((r) => r.taskId === task.id)?.criteria ?? [];
  const got = criteria.reduce((s, cr, i) => s + (checks?.includes(i) ? cr.points : 0), 0);

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-navy-900 dark:text-white">
          Câu {index + 1} <span className="font-normal text-slate-500 dark:text-slate-400">({task.points} điểm)</span>
        </h3>
        {revealed && (
          <span className="shrink-0 text-sm font-semibold tabular-nums text-navy-800 dark:text-navy-200">
            {Math.round(got * 100) / 100}/{task.points}
          </span>
        )}
      </div>
      <p className="whitespace-pre-line text-slate-800 dark:text-slate-200">{task.prompt}</p>
      <div>
        <label htmlFor={id} className="sr-only">
          Bài làm câu {index + 1}
        </label>
        <textarea
          id={id}
          value={draft}
          onChange={(e) => setDraft(c.id, task.id, e.target.value)}
          readOnly={revealed}
          rows={revealed ? Math.min(12, Math.max(3, draft.split("\n").length + 1)) : 6}
          placeholder="Viết câu trả lời (tiếng Anh hoặc tiếng Việt)…"
          className={cx(
            "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100",
            revealed && "bg-slate-50 dark:bg-slate-900",
          )}
        />
        {!revealed && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{draft ? "Đã lưu nháp tự động." : "Bản nháp được lưu tự động khi bạn gõ."}</p>}
      </div>

      {revealed && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-label={`Đáp án mẫu câu ${index + 1}`} className="rounded-xl border border-green-200 bg-green-50/60 p-4 text-[0.95rem] dark:border-green-900 dark:bg-green-950/30">
            <p className="mb-1 text-sm font-semibold text-green-800 dark:text-green-300">Đáp án mẫu (EN)</p>
            <Markdown text={model} />
          </section>
          <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Rubric – tự chấm</legend>
            <ul className="space-y-2">
              {criteria.map((cr, i) => {
                const checked = checks?.includes(i) ?? false;
                return (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheck(c.id, task.id, i)}
                        className="mt-1 h-4 w-4 shrink-0 accent-navy-700"
                      />
                      <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">{cr.text}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-400">{cr.points}đ</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </div>
      )}
    </Card>
  );
}

function CaseView({ c }: { c: CaseStudy }) {
  const revealed = useCases((s) => !!s.revealed[c.id]);
  const drafts = useCases((s) => s.drafts[c.id] ?? NO_TEXT);
  const checks = useCases((s) => s.checks[c.id]);
  const history = useCases((s) => s.history);
  const reveal = useCases((s) => s.reveal);
  const saveScore = useCases((s) => s.saveScore);
  const resetCase = useCases((s) => s.resetCase);
  const [dialog, setDialog] = useState<"submit" | "reset" | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const score = caseScore(c, checks ?? {});
  const best = bestCaseScores(history).get(c.id);
  const empty = c.tasks.filter((t) => !(drafts[t.id] ?? "").trim()).length;

  return (
    <>
      <PageHeader title={c.title}>
        <ButtonLink to="/cases" variant="secondary">
          ← Danh sách case
        </ButtonLink>
      </PageHeader>
      <div className="-mt-3 mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">{c.id}</span>
        {c.chapters.map((ch) => (
          <span key={ch} className="rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: CHAPTER_BY_ID[ch].color }}>
            {ch}
          </span>
        ))}
        <span>
          · {DIFF_LABEL[c.difficulty]} {"●".repeat(c.difficulty)}
        </span>
        <span>· ~{c.estMinutes} phút</span>
        {best !== undefined && <span>· Điểm cao nhất {best}/10</span>}
      </div>

      <section aria-labelledby="scenario-h" className="mb-6">
        <Card>
          <h2 id="scenario-h" className="mb-1 text-lg font-semibold text-navy-900 dark:text-white">
            Tình huống (Scenario)
          </h2>
          <Markdown text={c.scenario} />
        </Card>
      </section>

      <section aria-label="Câu hỏi" className="space-y-4">
        {c.tasks.map((t, i) => (
          <TaskBlock key={t.id} c={c} index={i} revealed={revealed} />
        ))}
      </section>

      {!revealed ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => (empty > 0 ? setDialog("submit") : reveal(c.id))}>Nộp & xem đáp án</Button>
          <p className="text-sm text-slate-600 dark:text-slate-400">Sau khi nộp, đối chiếu với đáp án mẫu và tích các tiêu chí rubric bạn đạt được.</p>
        </div>
      ) : (
        <>
          <Card className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center gap-4 border-navy-200 shadow-lg dark:border-navy-800">
            <p className="text-lg">
              Điểm tự chấm: <strong className="tabular-nums text-navy-900 dark:text-white">{score.total}/10</strong>
            </p>
            <Button
              onClick={() => {
                saveScore(c.id, score.total);
                setSavedAt(Date.now());
              }}
            >
              Lưu điểm
            </Button>
            <Button variant="secondary" onClick={() => setDialog("reset")}>
              Làm lại
            </Button>
            <span className="text-sm text-correct dark:text-green-400" aria-live="polite">
              {savedAt ? "Đã lưu vào lịch sử." : ""}
            </span>
          </Card>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-2 font-semibold text-navy-900 dark:text-white">⚠ Lỗi thường gặp</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-slate-800 dark:text-slate-200">
                {c.commonMistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-2 font-semibold text-navy-900 dark:text-white">📘 Nguồn</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                {c.sources.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}

      <ConfirmDialog
        open={dialog === "submit"}
        title="Nộp bài?"
        confirmLabel="Nộp & xem đáp án"
        cancelLabel="Làm tiếp"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          reveal(c.id);
        }}
      >
        Còn <strong>{empty}</strong> câu chưa có câu trả lời. Sau khi nộp, bài làm sẽ được khóa để đối chiếu với đáp án.
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "reset"}
        title="Làm lại case này?"
        confirmLabel="Làm lại"
        cancelLabel="Hủy"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          setSavedAt(null);
          resetCase(c.id);
        }}
      >
        Bài làm và các tiêu chí đã tích sẽ bị xóa. Điểm đã lưu trong lịch sử vẫn được giữ.
      </ConfirmDialog>
    </>
  );
}

export default function CasePage() {
  const { caseId = "" } = useParams();
  const cases = useAsync(loadCases, []);

  if (cases.status === "loading") return <p role="status">Đang tải case…</p>;
  if (cases.status === "error") return <p className="text-wrong">Không tải được dữ liệu case.</p>;
  const c = cases.data.find((x) => x.id === caseId);
  if (!c)
    return (
      <>
        <PageHeader title="Không tìm thấy case" subtitle={`Không có case với mã “${caseId}”.`} />
        <ButtonLink to="/cases">← Danh sách case</ButtonLink>
      </>
    );
  return <CaseView key={c.id} c={c} />;
}
