import { useParams, useNavigate } from "react-router-dom";
import { loadExams } from "@/data";
import { useBank, resolveIds } from "@/data/useBank";
import { useAsync } from "@/lib/useAsync";
import { Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { EXAM_DURATION_MIN, EXAM_SIZE } from "@/config/blueprint";
import { RANDOM_EXAM_ID, buildRandomExam } from "@/lib/exam";
import { useExams } from "@/store/examStore";
import { useSettings } from "@/store/settingsStore";
import { ExamRunner } from "./ExamRunner";

export default function ExamPage() {
  const { examId = "" } = useParams();
  const navigate = useNavigate();
  const exams = useAsync(loadExams, []);
  const bank = useBank();
  const session = useExams((s) => s.sessions[examId]);
  const startExam = useExams((s) => s.startExam);
  const duration = useSettings((s) => s.examDurationMin) ?? EXAM_DURATION_MIN;

  const isRandom = examId === RANDOM_EXAM_ID;
  const fixed = exams.status === "ready" ? exams.data.exams.find((e) => e.id === examId) : undefined;

  // The intro only needs exams.json; the question bank is needed for the runner and for building a random exam.
  if (exams.status === "loading") return <p role="status">Đang tải đề thi…</p>;
  if (exams.status === "error" || bank.status === "error") return <p className="text-wrong">Không tải được dữ liệu đề thi.</p>;

  if (!isRandom && !fixed)
    return (
      <>
        <PageHeader title="Không tìm thấy đề" subtitle={`Không có đề với mã “${examId}”.`} />
        <ButtonLink to="/exams">← Về danh sách đề</ButtonLink>
      </>
    );

  if (session) {
    if (bank.status !== "ready") return <p role="status">Đang tải câu hỏi…</p>;
    const questions = resolveIds(bank.data.byId, session.exam.questionIds);
    return (
      <ExamRunner
        session={session}
        questions={questions}
        onSubmitted={(attemptId) => navigate(`/exams/${examId}/result/${attemptId}`, { replace: true })}
      />
    );
  }

  const title = isRandom ? "Đề ngẫu nhiên" : fixed!.title;
  const bankReady = bank.status === "ready";
  const start = () => {
    if (isRandom && !bankReady) return;
    const exam = isRandom && bankReady ? buildRandomExam(bank.data.all, Date.now(), duration) : fixed!;
    startExam(exam, duration);
  };

  return (
    <>
      <PageHeader title={title} subtitle={isRandom ? "Đề được rút ngẫu nhiên từ toàn bộ ngân hàng theo blueprint." : undefined} />
      <Card className="max-w-2xl space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          <li>
            <strong>{EXAM_SIZE} câu</strong> trắc nghiệm, thời gian <strong>{duration} phút</strong> (đổi ở trang danh sách đề).
          </li>
          <li>Không hiện đáp án và giải thích trong lúc làm bài; xem lại đầy đủ sau khi nộp.</li>
          <li>Bài làm và đồng hồ được lưu tự động — tải lại trang vẫn tiếp tục được. Hết giờ, bài sẽ tự nộp.</li>
          <li>
            Phím tắt: <kbd>A</kbd>–<kbd>D</kbd> hoặc <kbd>1</kbd>–<kbd>4</kbd> chọn đáp án, <kbd>Enter</kbd> câu tiếp, <kbd>F</kbd> đánh dấu.
          </li>
          <li>Câu bỏ trống tính là sai. Điểm quy về thang 10.</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button onClick={start} disabled={isRandom && !bankReady}>
            Bắt đầu làm bài
          </Button>
          <ButtonLink to="/exams" variant="secondary">
            Về danh sách đề
          </ButtonLink>
          {isRandom && !bankReady && (
            <span role="status" className="self-center text-sm text-slate-600 dark:text-slate-400">
              Đang tải ngân hàng câu hỏi…
            </span>
          )}
        </div>
      </Card>
    </>
  );
}
