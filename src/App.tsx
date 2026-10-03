import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "@/features/dashboard/DashboardPage";
import NotFoundPage from "@/features/NotFoundPage";

// Feature pages are code-split; the dashboard ships in the main chunk.
const LearnPage = lazy(() => import("@/features/learn/LearnPage"));
const PracticePage = lazy(() => import("@/features/practice/PracticePage"));
const ExamsListPage = lazy(() => import("@/features/exam/ExamsListPage"));
const ExamPage = lazy(() => import("@/features/exam/ExamPage"));
const ExamResultPage = lazy(() => import("@/features/exam/ExamResultPage"));
const CasesListPage = lazy(() => import("@/features/cases/CasesListPage"));
const CasePage = lazy(() => import("@/features/cases/CasePage"));
const ReviewPage = lazy(() => import("@/features/review/ReviewPage"));
const FlashcardsPage = lazy(() => import("@/features/review/FlashcardsPage"));
const GlossaryPage = lazy(() => import("@/features/review/GlossaryPage"));
const ToolsPage = lazy(() => import("@/features/tools/ToolsPage"));
const DiagramHub = lazy(() => import("@/features/diagrams/DiagramHub"));
const DiagramPage = lazy(() => import("@/features/diagrams/DiagramPage"));
const AccountPage = lazy(() => import("@/features/account/AccountPage"));
const ToolPage = lazy(() => import("@/features/tools/ToolsPage").then((m) => ({ default: m.ToolPage })));

const page = (el: ReactNode) => (
  <Suspense fallback={<p className="text-slate-500 dark:text-slate-400" role="status">Đang tải…</p>}>{el}</Suspense>
);

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "learn/:chapterId", element: page(<LearnPage />) },
      { path: "practice", element: page(<PracticePage />) },
      { path: "exams", element: page(<ExamsListPage />) },
      { path: "exams/:examId", element: page(<ExamPage />) },
      { path: "exams/:examId/result/:attemptId", element: page(<ExamResultPage />) },
      { path: "cases", element: page(<CasesListPage />) },
      { path: "cases/:caseId", element: page(<CasePage />) },
      { path: "review", element: page(<ReviewPage />) },
      { path: "flashcards", element: page(<FlashcardsPage />) },
      { path: "glossary", element: page(<GlossaryPage />) },
      { path: "tools", element: page(<ToolsPage />) },
      { path: "tools/:toolId", element: page(<ToolPage />) },
      { path: "account", element: page(<AccountPage />) },
      { path: "diagrams", element: page(<DiagramHub />) },
      { path: "diagrams/:id", element: page(<DiagramPage />) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const ROUTER_FUTURE = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
} as const;

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL, future: ROUTER_FUTURE });

export default function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
