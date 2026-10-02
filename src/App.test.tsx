import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ROUTER_FUTURE, routes } from "./App";

const PATHS: [string, RegExp][] = [
  ["/", /Tổng quan/],
  ["/learn/c3", /Định giá trong TMQT & Incoterms/],
  ["/practice", /Luyện trắc nghiệm/],
  ["/exams", /Thi thử/],
  ["/exams/EXAM-01", /Đề thi thử số 1/],
  ["/exams/random", /Đề ngẫu nhiên/],
  ["/exams/EXAM-99", /Không tìm thấy đề/],
  ["/exams/EXAM-01/result/x", /Không tìm thấy kết quả/],
  ["/cases", /Case study/],
  ["/cases/CASE-C5-01", /Checking the dates of a letter of credit/],
  ["/cases/CASE-C9-99", /Không tìm thấy case/],
  ["/review", /Ôn câu sai/],
  ["/flashcards", /Flashcards/],
  ["/glossary", /Thuật ngữ EN–VI/],
  ["/tools", /Công cụ tương tác/],
  ["/tools/incoterms", /Incoterms® 2020 Explorer/],
  ["/account", /Tài khoản/],
  ["/learn/c9", /Không tìm thấy trang/],
  ["/nope", /Không tìm thấy trang/],
];

describe("routes", () => {
  it.each(PATHS)("%s renders its page heading", async (path, heading) => {
    const router = createMemoryRouter(routes, { initialEntries: [path], future: ROUTER_FUTURE });
    render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
    expect(await screen.findByRole("heading", { level: 1, name: heading }, { timeout: 5000 })).toBeInTheDocument();
  });
});
