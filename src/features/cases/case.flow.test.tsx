import { fireEvent, render, screen, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ROUTER_FUTURE, routes } from "@/App";
import { useCases } from "@/store/caseStore";

const T = { timeout: 5000 };

beforeEach(() => {
  localStorage.clear();
  useCases.setState({ drafts: {}, revealed: {}, checks: {}, history: [] });
});

it("case: draft autosave → submit → model answer + rubric self-grading → saved score", async () => {
  const router = createMemoryRouter(routes, { initialEntries: ["/cases/CASE-C5-01"], future: ROUTER_FUTURE });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  await screen.findByRole("heading", { level: 1, name: /Checking the dates/ }, T);

  fireEvent.change(screen.getByLabelText("Bài làm câu 1"), { target: { value: "Presentation on 20 Sep is late." } });
  expect(useCases.getState().drafts["CASE-C5-01"]!.t1).toBe("Presentation on 20 Sep is late.");

  // Two tasks are still empty → confirmation.
  fireEvent.click(screen.getByRole("button", { name: "Nộp & xem đáp án" }));
  const dialog = screen.getByRole("alertdialog");
  expect(dialog).toHaveTextContent("2");
  fireEvent.click(within(dialog).getByRole("button", { name: "Nộp & xem đáp án" }));

  expect(screen.getAllByText("Đáp án mẫu (EN)")).toHaveLength(3);
  const boxes = screen.getAllByRole("checkbox");
  fireEvent.click(boxes[0]!); // 1 point
  fireEvent.click(boxes[1]!); // 1 point
  expect(screen.getByText("2/10")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Lưu điểm" }));
  expect(useCases.getState().history[0]).toMatchObject({ caseId: "CASE-C5-01", score: 2 });
  expect(screen.getByText("⚠ Lỗi thường gặp")).toBeInTheDocument();
}, 20000);
