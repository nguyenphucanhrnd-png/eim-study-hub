import { Link } from "react-router-dom";
import { Badge, Card, PageHeader, cx } from "@/components/ui";
import { CHAPTERS } from "@/config/chapters";
import { STATUS_CHIP, STATUS_VI, useAllDiagramStatuses } from "./engine/useDiagramProgress";
import { DIAGRAMS, type DiagramMeta } from "./catalog";

const QUIZ_VI: Record<DiagramMeta["quizzes"][number], string> = {
  order: "Sắp xếp",
  actor: "Ai làm?",
  gap: "Bước thiếu",
  classify: "Phân loại",
  incident: "Sự cố",
  scenario: "Tình huống",
};

/** /diagrams — every interactive diagram, grouped by chapter, with progress. */
export default function DiagramHub() {
  const statusOf = useAllDiagramStatuses();
  const done = DIAGRAMS.filter((d) => ["explored", "mastered"].includes(statusOf(d.id))).length;
  return (
    <>
      <PageHeader
        title="Sơ đồ tương tác"
        subtitle={`Các sơ đồ và quy trình trong slide, vẽ lại để bấm, chạy và tự kiểm tra. Đã khám phá ${done}/${DIAGRAMS.length} sơ đồ.`}
      >
        <Link to="/journey" className="text-sm font-medium text-navy-700 underline dark:text-navy-200">
          Hành trình xuất nhập khẩu →
        </Link>
      </PageHeader>
      <div className="space-y-8">
        {CHAPTERS.map((c) => {
          const list = DIAGRAMS.filter((d) => d.chapter === c.id);
          if (list.length === 0) return null;
          return (
            <section key={c.id} aria-labelledby={`hub-${c.id}`}>
              <h2 id={`hub-${c.id}`} className="mb-3 flex items-center gap-2 text-lg font-semibold text-navy-900 dark:text-white">
                <span className="rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: c.color }}>
                  {c.id}
                </span>
                {c.titleVi}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((d) => {
                  const st = statusOf(d.id);
                  return (
                    <li key={d.id}>
                      <Card className="flex h-full flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge color={d.provenance === "slide" ? "#1e3a5f" : "#6d28d9"}>{d.provenance === "slide" ? "Slide" : "Tổng hợp"}</Badge>
                          <span className={cx("rounded-md px-2 py-0.5 text-xs font-semibold", STATUS_CHIP[st])}>{STATUS_VI[st]}</span>
                        </div>
                        <h3 className="font-semibold leading-snug text-slate-900 dark:text-white">
                          <Link to={`/diagrams/${d.id}`} className="hover:underline">
                            {d.titleVi}
                          </Link>
                        </h3>
                        <p className="text-sm italic text-slate-600 dark:text-slate-400" lang="en">
                          {d.title}
                        </p>
                        <p className="mt-auto text-xs text-slate-600 dark:text-slate-400">
                          {d.stepCount} bước · ~{d.estMinutes} phút{d.slideRef ? ` · ${d.slideRef}` : ""}
                          {d.quizzes.length > 0 && ` · Đố: ${d.quizzes.map((q) => QUIZ_VI[q]).join(", ")}`}
                        </p>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
