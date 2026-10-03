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
const CUSTOM_VIEWS: Record<string, () => Promise<ViewModule>> = {
  "c2-export-plan": () => import("./custom/P2Views").then((m) => ({ default: m.ExportPlanView })),
  "c3-2010-vs-2020": () => import("./custom/P2Views").then((m) => ({ default: m.Incoterms2010vs2020View })),
  "c6-contract-anatomy": () => import("./custom/P2Views").then((m) => ({ default: m.ContractView })),
  "c7-document-lifecycle": () => import("./custom/P2Views").then((m) => ({ default: m.DocumentLifecycleView })),
  "c7-bl-types": () => import("./custom/P2Views").then((m) => ({ default: m.BlTypesView })),
  "c7-proforma-vs-commercial": () => import("./custom/P2Views").then((m) => ({ default: m.InvoicesView })),
  "c1-export-process": () => import("./custom/C1C3Views").then((m) => ({ default: m.ExportProcessView })),
  "c1-two-flows": () => import("./custom/C1C3Views").then((m) => ({ default: m.TwoFlowsView })),
  "c1-stakeholder-hub": () => import("./custom/C1C3Views").then((m) => ({ default: m.HubView })),
  "c3-pricing-objectives": () => import("./custom/C1C3Views").then((m) => ({ default: m.PricingView })),
  "c3-incoterms-purpose-scope": () => import("./custom/C1C3Views").then((m) => ({ default: m.ScopeView })),
  "c3-carriage-incoterms": () => import("./custom/CarriageView"),
  "c5-lc-fig113": () => import("./custom/Fig113View"),
  "c5-method-compare": () => import("./custom/MethodCompareView"),
  "c8-export-procedure": () => import("./custom/ExportProcedureView"),
  "c8-import-procedure": () => import("./custom/ImportProcedureView"),
};

/** Load the view of a diagram: a custom component, or the generic engine viewer of its spec. */
export function loadDiagramView(meta: DiagramMeta): Promise<ViewModule> {
  const custom = CUSTOM_VIEWS[meta.id];
  if (custom) return custom();
  if (meta.loadSpec) return specView(meta.loadSpec)();
  return Promise.reject(new Error(`No view for diagram ${meta.id}`));
}

export const hasDiagram = (id: string) => DIAGRAM_BY_ID.has(id);
