import { useMemo, useState, type ReactNode } from "react";
import { useBank, resolveIds } from "@/data/useBank";
import { Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { CHAPTER_BY_ID, topicLabel } from "@/config/chapters";
import { WRONG_BANK_EXIT_STREAK } from "@/lib/progress";
import { createRng, shuffle } from "@/lib/rng";
import { useProgress } from "@/store/progressStore";
import type { MCQ } from "@/schemas/mcq";
import { PracticeSession } from "@/features/practice/PracticeSession";

type Tab = "wrong" | "flagged";

function QuestionRow({ q, children }: { q: MCQ; children?: ReactNode }) {
  const ch = CHAPTER_BY_ID[q.chapter];
  return (
    <li className="flex flex-wrap items-start gap-3 border-t border-slate-200 px-4 py-3 first:border-t-0 dark:border-slate-800">
      <span className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: ch.color }}>
        {ch.id}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-slate-800 dark:text-slate-200">{q.stem}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{topicLabel(q.chapter, q.topic)}</p>
      </div>
      {children}
    </li>
  );
}

export default function ReviewPage() {
  const bank = useBank();
  const wrongBank = useProgress((s) => s.wrongBank);
  const flagged = useProgress((s) => s.flagged);
  const toggleFlag = useProgress((s) => s.toggleFlag);
  const [tab, setTab] = useState<Tab>("wrong");
  const [session, setSession] = useState<{ key: number; questions: MCQ[] } | null>(null);

  // Most recent first.
  const wrongIds = useMemo(() => Object.entries(wrongBank).sort((a, b) => b[1].addedAt - a[1].addedAt).map(([id]) => id), [wrongBank]);
  const flaggedIds = useMemo(() => Object.entries(flagged).sort((a, b) => b[1] - a[1]).map(([id]) => id), [flagged]);

  const byId = bank.status === "ready" ? bank.data.byId : null;
  const wrongQs = byId ? resolveIds(byId, wrongIds) : [];
  const flaggedQs = byId ? resolveIds(byId, flaggedIds) : [];
  const list = tab === "wrong" ? wrongQs : flaggedQs;

  const start = (qs: MCQ[]) => {
    const seed = Date.now();
    setSession({ key: seed, questions: shuffle(qs, createRng(seed)) });
  };

  return (
    <>
      <PageHeader
        title="Ôn câu sai & câu đánh dấu"
        subtitle={`Câu trả lời sai tự động vào ngân hàng ôn tập và rời đi sau ${WRONG_BANK_EXIT_STREAK} lần đúng liên tiếp.`}
      />

      {session ? (
        <PracticeSession
          key={session.key}
          questions={session.questions}
          exitLabel="Về danh sách"
          onExit={() => setSession(null)}
          onRestart={() => {
            // Re-read the store: questions answered correctly twice have left the bank.
            const s = useProgress.getState();
            const ids = tab === "wrong" ? Object.keys(s.wrongBank) : Object.keys(s.flagged);
            const qs = byId ? resolveIds(byId, ids) : [];
            if (qs.length) start(qs);
            else setSession(null);
          }}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm text-slate-600 dark:text-slate-400">Ngân hàng câu sai</p>
              <p className="text-3xl font-bold tabular-nums text-wrong dark:text-red-400">{wrongIds.length}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-600 dark:text-slate-400">Câu đã đánh dấu</p>
              <p className="text-3xl font-bold tabular-nums text-flag dark:text-amber-400">{flaggedIds.length}</p>
            </Card>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label="Danh sách"
              value={tab}
              options={[
                { value: "wrong", label: `Câu sai (${wrongIds.length})` },
                { value: "flagged", label: `Đã đánh dấu (${flaggedIds.length})` },
              ]}
              onChange={setTab}
            />
            <Button disabled={list.length === 0} onClick={() => start(list)}>
              Luyện lại {list.length} câu
            </Button>
          </div>

          {bank.status === "loading" && <p role="status">Đang tải…</p>}
          {bank.status === "ready" && list.length === 0 && (
            <Card className="text-center text-slate-600 dark:text-slate-400">
              {tab === "wrong" ? (
                <>
                  Chưa có câu sai nào. <ButtonLink to="/practice" variant="ghost">Luyện tập ngay</ButtonLink>
                </>
              ) : (
                "Chưa có câu nào được đánh dấu. Nhấn “Đánh dấu” (hoặc phím F) khi làm bài để lưu câu muốn xem lại."
              )}
            </Card>
          )}
          {list.length > 0 && (
            <ul className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {list.map((q) =>
                tab === "wrong" ? (
                  <QuestionRow key={q.id} q={q}>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400" title="Số lần đúng liên tiếp kể từ lần sai gần nhất">
                      Đúng liên tiếp {wrongBank[q.id]?.streak ?? 0}/{WRONG_BANK_EXIT_STREAK}
                    </span>
                  </QuestionRow>
                ) : (
                  <QuestionRow key={q.id} q={q}>
                    <Button variant="ghost" className="shrink-0 px-2 py-1 text-xs" onClick={() => toggleFlag(q.id)}>
                      Bỏ đánh dấu
                    </Button>
                  </QuestionRow>
                ),
              )}
            </ul>
          )}
        </>
      )}
    </>
  );
}
