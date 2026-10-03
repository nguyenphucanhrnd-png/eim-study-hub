import { useAsync } from "@/lib/useAsync";
import { loadDiagramView, type DiagramMeta, type DiagramViewProps } from "./registry";

/** Loads and renders one diagram view (each diagram is its own lazy chunk). */
export function DiagramView({ meta, ...props }: DiagramViewProps & { meta: DiagramMeta }) {
  const view = useAsync(() => loadDiagramView(meta), [meta.id]);
  if (view.status === "loading") return <p role="status">Đang tải sơ đồ…</p>;
  if (view.status === "error") return <p className="text-wrong">Không tải được sơ đồ.</p>;
  const View = view.data.default;
  return <View {...props} />;
}
