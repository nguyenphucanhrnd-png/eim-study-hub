import { fireEvent, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ROUTER_FUTURE, routes } from "@/App";
import { useProgress } from "@/store/progressStore";

const T = { timeout: 5000 };

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetProgress();
});

it("practice: filters from the URL, instant feedback, wrong answers go to the review bank", async () => {
  const router = createMemoryRouter(routes, { initialEntries: ["/practice?chapter=C8"], future: ROUTER_FUTURE });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);

  expect(await screen.findByText(/24 câu phù hợp/, {}, T)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Bắt đầu luyện" }));

  // Answer every question with "A"; each answer reveals the explanation immediately.
  for (let i = 0; i < 10; i++) {
    expect(screen.getByText(`Câu ${i + 1}/10`)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "a" });
    expect(screen.getByText(/Đáp án đúng:/)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Enter" });
  }
  expect(screen.getByRole("heading", { name: "Hoàn thành!" })).toBeInTheDocument();

  const { stats, wrongBank } = useProgress.getState();
  expect(Object.keys(stats)).toHaveLength(10);
  const wrong = Object.values(stats).filter((s) => !s.lastCorrect).length;
  expect(Object.keys(wrongBank)).toHaveLength(wrong);
});
