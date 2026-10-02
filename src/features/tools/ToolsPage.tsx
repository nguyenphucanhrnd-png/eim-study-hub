import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { CHAPTER_BY_ID } from "@/config/chapters";
import { Badge, Card, ComingSoon, PageHeader } from "@/components/ui";
import NotFoundPage from "@/features/NotFoundPage";
import { TOOLS } from "./toolsConfig";
import { TOOL_COMPONENTS, preloadTool } from "./registry";

// Direct visit to /tools/:toolId: fetch the tool chunk in parallel with rendering this page.
if (typeof window !== "undefined") {
  const m = window.location.pathname.match(/\/tools\/([^/]+)\/?$/);
  if (m?.[1]) preloadTool(m[1]);
}

export default function ToolsPage() {
  return (
    <>
      <PageHeader title="Công cụ tương tác" subtitle="Các công cụ trực quan giúp hiểu nhanh những phần khó nhớ." />
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const ch = CHAPTER_BY_ID[tool.chapter];
          return (
            <Link key={tool.id} to={`/tools/${tool.id}`} className="group rounded-xl">
              <Card className="h-full transition-colors duration-150 group-hover:border-navy-300 dark:group-hover:border-navy-600">
                <Badge color={ch.color}>{ch.id}</Badge>
                <h2 className="mt-2 font-semibold text-navy-900 group-hover:underline dark:text-white">{tool.title}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{tool.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function ToolPage() {
  const { toolId } = useParams();
  const tool = TOOLS.find((tl) => tl.id === toolId);
  if (!tool) return <NotFoundPage />;
  const Tool = TOOL_COMPONENTS[tool.id];
  const ch = CHAPTER_BY_ID[tool.chapter];
  return (
    <>
      <PageHeader title={tool.title} subtitle={tool.description}>
        <Link to={`/learn/${ch.slug}`} className="text-sm text-navy-700 underline dark:text-navy-200">
          Lý thuyết {ch.id}: {ch.shortVi}
        </Link>
      </PageHeader>
      {/* Tools use h3 internally (they are also embedded under h2 sections in Learn pages). */}
      <h2 className="sr-only">{tool.title}</h2>
      {Tool ? (
        <Suspense fallback={<p role="status">Đang tải công cụ…</p>}>
          <Tool />
        </Suspense>
      ) : (
        <ComingSoon phase={tool.phase} what={tool.title} />
      )}
    </>
  );
}
