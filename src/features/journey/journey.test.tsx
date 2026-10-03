import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import JourneyPage from "./JourneyPage";

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <JourneyPage />
    </MemoryRouter>,
  );

describe("JourneyPage", () => {
  it("shows the two C-rule markers and opens a card in the detail panel", () => {
    renderPage();
    expect(screen.getByText(/Chuyển rủi ro \(giai đoạn 7\)/)).toBeInTheDocument();
    expect(screen.getByText(/Chuyển chi phí \(giai đoạn 10\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Người mua mở L\/C/ }));
    const panel = screen.getByRole("complementary", { name: "Chi tiết bước" });
    expect(within(panel).getByRole("heading", { name: "Người mua mở L/C" })).toBeInTheDocument();
  });

  it("switching to air disables sea-only rules and explains why", () => {
    renderPage();
    fireEvent.click(screen.getByRole("radio", { name: "Hàng không" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/CIF chỉ dùng cho vận tải đường biển/);
    expect(screen.getByRole("option", { name: /FOB – Free On Board \(chỉ đường biển\)/ })).toBeDisabled();
  });
});
