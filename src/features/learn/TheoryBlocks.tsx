import { Suspense } from "react";
import { Callout } from "@/components/ui/Callout";
import { Markdown } from "@/components/ui/Markdown";
import type { Block } from "./parseTheory";
import { EMBEDS } from "./embeds";

export function TheoryBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "md") return <Markdown key={i} text={b.text} />;
        if (b.type === "callout")
          return (
            <Callout key={i} kind={b.kind} title={b.title}>
              <Markdown text={b.text} />
            </Callout>
          );
        const Embed = EMBEDS[b.name];
        if (!Embed) return <p key={i} className="text-red-600">Thiếu thành phần nhúng: {b.name}</p>;
        return (
          <div key={i} className="my-6">
            <Suspense fallback={<p role="status">Đang tải…</p>}>
              <Embed />
            </Suspense>
          </div>
        );
      })}
    </>
  );
}
