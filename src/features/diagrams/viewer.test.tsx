import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useProgress } from "@/store/progressStore";
import { DiagramViewer } from "./engine/DiagramViewer";
import lc from "./specs/c5-lc-basic";

const renderViewer = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DiagramViewer spec={lc} />
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetProgress();
});

describe("DiagramViewer (pilot: L/C)", () => {
  it("clicking a step badge opens the step panel and records the step as viewed", () => {
    renderViewer();
    fireEvent.click(screen.getByRole("button", { name: /^Bước 7:/ }));
    const panel = screen.getByRole("complementary", { name: "Chi tiết" });
    expect(within(panel).getByRole("heading", { name: /Ngân hàng phát hành kiểm tra, chấp nhận và thanh toán/ })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: /Luyện câu hỏi về bước này/ })).toHaveAttribute("href", "/practice?topic=lc-concept");
    expect(useProgress.getState().diagramViewed["c5-lc-basic"]).toContain("s:s7");
  });

  it("→ advances through the steps and the panel follows", () => {
    renderViewer();
    const play = screen.getByRole("button", { name: /Chạy quy trình/ });
    const root = play.closest("div.space-y-3")!;
    fireEvent.keyDown(root, { key: "ArrowRight" });
    expect(screen.getByText("Bước 1/9")).toBeInTheDocument();
    fireEvent.keyDown(root, { key: "ArrowRight" });
    expect(screen.getByText("Bước 2/9")).toBeInTheDocument();
    const panel = screen.getByRole("complementary", { name: "Chi tiết" });
    expect(within(panel).getByRole("heading", { name: /phát hành L\/C, chuyển cho ngân hàng thông báo/ })).toBeInTheDocument();
    fireEvent.keyDown(root, { key: "Escape" });
    expect(within(panel).queryByRole("heading", { name: /phát hành L\/C/ })).not.toBeInTheDocument();
  });

  it("node click shows the actor panel with alternative names", () => {
    renderViewer();
    fireEvent.click(screen.getByRole("button", { name: /^ISSUING BANK/ }));
    const panel = screen.getByRole("complementary", { name: "Chi tiết" });
    expect(within(panel).getByText(/Opening bank/)).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /Người mua làm đơn và mở L\/C/ })).toBeInTheDocument();
  });

  it("order quiz: sorting with the keyboard-accessible ↑/↓ buttons, then checking, records mastery at 100%", () => {
    renderViewer();
    fireEvent.click(screen.getByRole("radio", { name: "Sắp xếp các bước" }));
    const correct = [...lc.steps].sort((a, b) => a.order - b.order).map((s) => s.titleVi);
    // Bubble each step into place using the "lên" buttons.
    for (let target = 0; target < correct.length; target++) {
      const list = screen.getByRole("list", { name: "Các bước cần sắp xếp" });
      const items = within(list).getAllByRole("listitem");
      let pos = items.findIndex((li) => li.textContent?.includes(correct[target]!));
      while (pos > target) {
        fireEvent.click(within(within(list).getAllByRole("listitem")[pos]!).getByRole("button", { name: /lên$/ }));
        pos--;
      }
    }
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra" }));
    expect(screen.getByText(/Chính xác 100%/)).toBeInTheDocument();
    expect(useProgress.getState().diagramQuiz["c5-lc-basic"]).toEqual({ order: 100 });
    expect(screen.getByText("Đã thành thạo")).toBeInTheDocument();
  });

  it("actor quiz hides labels and marks the right actor", () => {
    renderViewer();
    fireEvent.click(screen.getByRole("radio", { name: "Ai làm bước này?" }));
    expect(screen.queryByRole("button", { name: /^ISSUING BANK/ })).not.toBeInTheDocument();
    // Step 1 is performed by the importer (bottom-right node = 4th node).
    fireEvent.click(screen.getByRole("button", { name: "Đối tượng 4 (nhãn bị ẩn)" }));
    expect(screen.getByText(/^Đúng — IMPORTER/)).toBeInTheDocument();
  });
});
