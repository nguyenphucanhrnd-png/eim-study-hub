import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ROUTER_FUTURE, routes } from "@/App";
import { useExams } from "@/store/examStore";
import { useProgress } from "@/store/progressStore";

const T = { timeout: 5000 };

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: ROUTER_FUTURE });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  return router;
}

beforeEach(() => {
  localStorage.clear();
  useExams.setState({ sessions: {}, attempts: [] });
  useProgress.getState().resetProgress();
});

describe("mock exam flow", () => {
  it("starts, autosaves answers, confirms an early submit and shows the results", async () => {
    const router = renderAt("/exams/EXAM-01");
    fireEvent.click(await screen.findByRole("button", { name: "Bắt đầu làm bài" }, T));

    // Runner: timer + 50-question navigator.
    expect(await screen.findByRole("timer", {}, T)).toHaveTextContent("60:00");
    const nav = screen.getAllByRole("navigation", { name: "Danh sách câu hỏi" })[0]!;
    expect(within(nav).getAllByRole("button")).toHaveLength(50);

    // Answer Q1 with the keyboard, then move on with Enter.
    fireEvent.keyDown(window, { key: "a" });
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByText("Câu 2/50")).toBeInTheDocument();

    // Autosaved in the persisted store.
    const session = useExams.getState().sessions["EXAM-01"]!;
    expect(Object.keys(session.answers)).toHaveLength(1);
    expect(session.current).toBe(1);

    // Early submit asks for confirmation (49 unanswered).
    fireEvent.click(screen.getAllByRole("button", { name: "Nộp bài" })[0]!);
    const dialog = screen.getByRole("alertdialog", { name: "Nộp bài?" });
    expect(dialog).toHaveTextContent("49");
    fireEvent.click(within(dialog).getByRole("button", { name: "Nộp bài" }));

    expect(await screen.findByRole("heading", { level: 1, name: /Kết quả: Đề thi thử số 1/ }, T)).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/exams\/EXAM-01\/result\/EXAM-01-\d+$/);
    const attempt = useExams.getState().attempts[0]!;
    expect(attempt.total).toBe(50);
    expect(useExams.getState().sessions["EXAM-01"]).toBeUndefined();
    // The answered question was recorded in progress stats.
    expect(Object.keys(useProgress.getState().stats)).toHaveLength(1);
    expect(screen.getByText(`${attempt.score10}/10`)).toBeInTheDocument();
  }, 20000);

  it("resumes an in-progress exam after a reload and auto-submits when time is up", async () => {
    renderAt("/exams/EXAM-02");
    fireEvent.click(await screen.findByRole("button", { name: "Bắt đầu làm bài" }, T));
    await screen.findByRole("timer", {}, T);
    fireEvent.keyDown(window, { key: "2" });

    // "Reload": unmount and mount the route again — the session comes back from the store.
    cleanup();
    renderAt("/exams/EXAM-02");
    expect(await screen.findByRole("timer", {}, T)).toBeInTheDocument();
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);

    // Time runs out (wall-clock based): the runner submits on its next tick.
    act(() => {
      const s = useExams.getState().sessions["EXAM-02"]!;
      useExams.setState({ sessions: { "EXAM-02": { ...s, startedAt: Date.now() - 61 * 60 * 1000 } } });
    });
    expect(await screen.findByRole("heading", { level: 1, name: /Kết quả: Đề thi thử số 2/ }, T)).toBeInTheDocument();
    expect(useExams.getState().attempts[0]!.timedOut).toBe(true);
  }, 20000);

  it("builds a blueprint random exam", async () => {
    renderAt("/exams/random");
    const startBtn = await screen.findByRole("button", { name: "Bắt đầu làm bài" }, T);
    // Building a random exam needs the whole bank, which loads after first paint.
    await waitFor(() => expect(startBtn).toBeEnabled(), T);
    fireEvent.click(startBtn);
    await screen.findByRole("timer", {}, T);
    expect(useExams.getState().sessions["random"]!.exam.questionIds).toHaveLength(50);
  }, 20000);
});
