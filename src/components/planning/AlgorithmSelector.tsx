import { useAppStore } from "../../store/appStore";
import type { AlgorithmMode } from "../../types/domain";
import { MODE_LABELS } from "./labels";

const MODES: AlgorithmMode[] = ["pathScanning", "genetic", "memetic", "vns", "compare"];

export default function AlgorithmSelector() {
  const mode = useAppStore((s) => s.algorithmMode);
  const setMode = useAppStore((s) => s.setAlgorithmMode);

  return (
    <div className="algo-selector">
      {MODES.map((m) => (
        <button
          key={m}
          className={"algo-pill" + (m === mode ? " is-active" : "")}
          onClick={() => setMode(m)}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
