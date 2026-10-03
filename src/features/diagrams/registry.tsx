import type { ComponentType } from "react";
import type { DiagramSpec } from "./engine/types";
import { DIAGRAM_BY_ID, type DiagramMeta } from "./catalog";

export { DIAGRAMS, DIAGRAM_BY_ID, loadAllSpecs, loadStepPool, type DiagramMeta } from "./catalog";

/** Props every diagram view accepts (deep link to a step). */
export interface DiagramViewProps {
  focusStepId?: string | null;
}

type ViewModule = { default: ComponentType<DiagramViewProps> };

/** Generic view: the engine viewer for a data spec. */
const specView = (load: () => Promise<DiagramSpec>) => () =>
  Promise.all([import("./engine/DiagramViewer"), load()]).then(([m, spec]) => ({
    default: function SpecView(props: DiagramViewProps) {
      return <m.DiagramViewer spec={spec} focusStepId={props.focusStepId} />;
    },
  }));

/** Diagrams with their own view component (wrappers around the engine or custom layouts). */
const CUSTOM_VIEWS: Record<string, () => Promise<ViewModule>> = {};

/** Load the view of a diagram: a custom component, or the generic engine viewer of its spec. */
export function loadDiagramView(meta: DiagramMeta): Promise<ViewModule> {
  const custom = CUSTOM_VIEWS[meta.id];
  if (custom) return custom();
  if (meta.loadSpec) return specView(meta.loadSpec)();
  return Promise.reject(new Error(`No view for diagram ${meta.id}`));
}

export const hasDiagram = (id: string) => DIAGRAM_BY_ID.has(id);
