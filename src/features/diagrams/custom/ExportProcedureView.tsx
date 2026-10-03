import type { DiagramViewProps } from "../registry";
import { ProcedureView } from "./ProcedureView";

export default function ExportProcedureView({ focusStepId }: DiagramViewProps) {
  return <ProcedureView which="export" focusStepId={focusStepId} />;
}
