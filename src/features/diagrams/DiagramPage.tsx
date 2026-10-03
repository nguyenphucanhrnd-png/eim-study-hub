import { Link, useParams, useSearchParams } from "react-router-dom";
import { ButtonLink, PageHeader } from "@/components/ui";
import { CHAPTER_BY_ID } from "@/config/chapters";
import { DIAGRAM_BY_ID } from "./catalog";
import { DiagramView } from "./DiagramView";

/** /diagrams/:id (?step=… focuses one step). */
export default function DiagramPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const meta = DIAGRAM_BY_ID.get(id);
  if (!meta)
    return (
      <>
        <PageHeader title="Không tìm thấy sơ đồ" subtitle={`Không có sơ đồ với mã “${id}”.`} />
        <ButtonLink to="/diagrams">← Tất cả sơ đồ</ButtonLink>
      </>
    );
  const ch = CHAPTER_BY_ID[meta.chapter];
  return (
    <>
      <PageHeader title={meta.titleVi} subtitle={meta.title}>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to={`/learn/${ch.slug}#diagram-${meta.id}`} className="text-navy-700 underline dark:text-navy-200">
            Lý thuyết {ch.id}: {ch.shortVi}
          </Link>
          <Link to="/diagrams" className="text-navy-700 underline dark:text-navy-200">
            Tất cả sơ đồ
          </Link>
        </div>
      </PageHeader>
      <DiagramView meta={meta} focusStepId={params.get("step")} />
    </>
  );
}
