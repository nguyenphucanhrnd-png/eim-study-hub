import { useCallback, useEffect, useState } from "react";
import type { Speed } from "../PlayerControls";

/** Auto-advance interval at 1× speed (DIAGRAMS_PROMPT §3.5: every 3 s). */
export const STEP_MS = 3000;

/**
 * Play state for one diagram: the current frame index (-1 = nothing selected),
 * play/pause and speed. Playing stops by itself after the last frame.
 */
export function usePlayer(frameCount: number) {
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("1");

  const goTo = useCallback((i: number) => setIndex(Math.max(-1, Math.min(frameCount - 1, i))), [frameCount]);
  const next = useCallback(() => setIndex((i) => Math.min(frameCount - 1, i + 1)), [frameCount]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(-1);
  }, []);
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p) setIndex((i) => (i >= frameCount - 1 ? 0 : i < 0 ? 0 : i));
      return !p;
    });
  }, [frameCount]);

  useEffect(() => {
    if (!playing) return;
    if (index >= frameCount - 1) {
      const t = window.setTimeout(() => setPlaying(false), STEP_MS / Number(speed));
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), STEP_MS / Number(speed));
    return () => window.clearTimeout(t);
  }, [playing, index, frameCount, speed]);

  // Keep the index valid when the frame list changes (variant switch).
  useEffect(() => {
    setIndex((i) => Math.min(i, frameCount - 1));
  }, [frameCount]);

  return { index, playing, speed, setSpeed, goTo, next, prev, reset, toggle, setPlaying };
}
