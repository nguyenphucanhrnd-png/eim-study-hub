import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Element styling for theory and case markdown (no typography plugin; kept explicit). */
const MD: Components = {
  h3: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-semibold text-navy-900 dark:text-white">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-1 mt-4 font-semibold text-slate-800 dark:text-slate-100">{children}</h4>,
  p: ({ children }) => <p className="my-3">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6 marker:text-slate-400">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6 marker:font-semibold marker:text-slate-500">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} className="text-navy-700 underline underline-offset-2 dark:text-navy-200">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] dark:bg-slate-800">{children}</code>,
  // Wide tables size to their content (each cell capped) and scroll inside their own box with a sticky header.
  table: ({ children }) => (
    <div className="my-4 max-h-[75vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-max min-w-full border-collapse text-[0.92rem]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left align-bottom font-semibold">
      <div className="max-w-[22rem]">{children}</div>
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-slate-200 px-3 py-2 align-top dark:border-slate-800">
      <div className="max-w-[22rem]">{children}</div>
    </td>
  ),
};

export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
      {text}
    </ReactMarkdown>
  );
}
