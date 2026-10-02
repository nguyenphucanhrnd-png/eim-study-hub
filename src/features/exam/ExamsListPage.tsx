import { Link } from "react-router-dom";
import { loadExams } from "@/data";
import { useAsync } from "@/lib/useAsync";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { EXAM_COUNT, EXAM_DURATION_MIN, EXAM_SIZE } from "@/config/blueprint";
import { RANDOM_EXAM_ID, formatDurationVi } from "@/lib/exam";
import { examStats, useExams } from "@/store/examStore";
import { useSettings } from "@/store/settingsStore";

const DURATIONS = [30, 45, 60, 90] as const;

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function ExamsListPage() {
  const exams = useAsync(loadExams, []);
  const sessions = useExams((s) => s.sessions);
  const attempts = useExams((s) => s.attempts);
  const duration = useSettings((s) => s.examDurationMin) ?? EXAM_DURATION_MIN;
  const setDuration = useSettings((s) => s.setExamDuration);
  const stats = examStats(attempts);
  const randomStats = stats.get(RANDOM_EXAM_ID);

  return (
    <>
      <PageHeader
        title="Thi thử"
        subtitle={`${EXAM_COUNT} đề cố định × ${EXAM_SIZE} câu theo blueprint, cộng chế độ đề ngẫu nhiên. Không hiện giải thích trong lúc làm bài; bài làm được lưu tự động.`}
      />

      <Card className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Thời gian làm bài</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Áp dụng cho lượt bắt đầu mới (mặc định {EXAM_DURATION_MIN} phút).</p>
        </div>
        <Segmented
          label="Thời gian làm bài"
          value={String(duration)}
          options={DURATIONS.map((d) => ({ value: String(d), label: `${d} phút` }))}
          onChange={(v) => setDuration(Number(v) === EXAM_DURATION_MIN ? null : Number(v))}
        />
      </Card>

      <section aria-labelledby="random-h" className="mb-8">
        <Card className="flex flex-wrap items-center justify-between gap-4 border-navy-200 bg-navy-50/60 dark:border-navy-800 dark:bg-navy-950/40">
          <div>
            <h2 id="random-h" className="font-semibold text-navy-900 dark:text-white">
              Đề ngẫu nhiên
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rút {EXAM_SIZE} câu từ toàn bộ ngân hàng theo đúng blueprint (số câu mỗi chương, 20 dễ – 20 vừa – 10 khó).
              {randomStats && ` Cao nhất: ${randomStats.best}/10 · ${randomStats.count} lượt.`}
            </p>
          </div>
          <ButtonLink to={`/exams/${RANDOM_EXAM_ID}`}>{sessions[RANDOM_EXAM_ID] ? "Tiếp tục bài đang làm" : "Tạo đề ngẫu nhiên"}</ButtonLink>
        </Card>
      </section>

      <section aria-labelledby="fixed-h">
        <h2 id="fixed-h" className="mb-3 text-lg font-semibold text-navy-900 dark:text-white">
          Đề cố định
        </h2>
        {exams.status === "loading" && <p role="status">Đang tải danh sách đề…</p>}
        {exams.status === "error" && <p className="text-wrong">Không tải được danh sách đề.</p>}
        {exams.status === "ready" && (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {exams.data.exams.map((e) => {
              const st = stats.get(e.id);
              const active = sessions[e.id];
              return (
                <li key={e.id}>
                  <Card className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{e.title}</h3>
                      {active && <Badge color="#b45309">Đang làm</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {e.questionIds.length} câu · {duration} phút
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {st ? (
                        <>
                          Cao nhất <strong>{st.best}/10</strong> · {st.count} lượt ·{" "}
                          <Link className="underline" to={`/exams/${e.id}/result/${st.last.id}`}>
                            Kết quả gần nhất
                          </Link>
                        </>
                      ) : (
                        "Chưa làm"
                      )}
                    </p>
                    <div className="mt-auto">
                      <ButtonLink to={`/exams/${e.id}`} variant={active ? "primary" : "secondary"}>
                        {active ? "Tiếp tục" : st ? "Làm lại" : "Làm bài"}
                      </ButtonLink>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-h" className="mt-10">
        <h2 id="history-h" className="mb-3 text-lg font-semibold text-navy-900 dark:text-white">
          Lịch sử làm bài
        </h2>
        {attempts.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">Chưa có lượt thi nào.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Thời điểm</th>
                  <th scope="col" className="px-4 py-2 font-medium">Đề</th>
                  <th scope="col" className="px-4 py-2 font-medium">Điểm</th>
                  <th scope="col" className="px-4 py-2 font-medium">Số câu đúng</th>
                  <th scope="col" className="px-4 py-2 font-medium">Thời gian</th>
                  <th scope="col" className="px-4 py-2 font-medium"><span className="sr-only">Xem</span></th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 20).map((a) => (
                  <tr key={a.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums">{dateFmt.format(a.finishedAt)}</td>
                    <td className="px-4 py-2">{a.title}</td>
                    <td className="px-4 py-2 font-semibold tabular-nums">{a.score10}/10</td>
                    <td className="px-4 py-2 tabular-nums">
                      {a.correct}/{a.total}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {formatDurationVi(a.elapsedSec)}
                      {a.timedOut && " (hết giờ)"}
                    </td>
                    <td className="px-4 py-2">
                      <Link className="text-navy-700 underline dark:text-navy-300" to={`/exams/${a.examId}/result/${a.id}`}>
                        Xem lại
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
