import { Button } from "@/components/ui";
import { Segmented } from "@/components/ui/form";

export const SPEEDS = ["0.5", "1", "2"] as const;
export type Speed = (typeof SPEEDS)[number];

/** ◀ ▶ ⏯ + step counter, speed and reset (keyboard: ←/→, Space). */
export function PlayerControls({
  index,
  total,
  playing,
  speed,
  onPrev,
  onNext,
  onToggle,
  onReset,
  onSpeed,
}: {
  index: number;
  total: number;
  playing: boolean;
  speed: Speed;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
  onReset: () => void;
  onSpeed: (s: Speed) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" className="px-3" onClick={onPrev} disabled={index <= 0} aria-label="Bước trước (←)">
        ◀
      </Button>
      <Button className="min-w-24" onClick={onToggle} aria-label={playing ? "Tạm dừng (Space)" : "Chạy quy trình (Space)"}>
        {playing ? "⏸ Dừng" : "▶ Chạy"}
      </Button>
      <Button variant="secondary" className="px-3" onClick={onNext} disabled={index >= total - 1} aria-label="Bước sau (→)">
        ▶
      </Button>
      <span className="min-w-20 text-sm tabular-nums text-slate-700 dark:text-slate-300">
        {index >= 0 ? `Bước ${index + 1}/${total}` : `${total} bước`}
      </span>
      <Segmented label="Tốc độ" value={speed} options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))} onChange={onSpeed} />
      <Button variant="ghost" className="px-2" onClick={onReset} disabled={index < 0 && !playing}>
        ↺ Về đầu
      </Button>
    </div>
  );
}
