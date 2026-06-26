import { useAppStore } from "../../store/appStore";
import type { AlgorithmMode } from "../../types/domain";
import { MODE_LABELS } from "./labels";

const MODES: AlgorithmMode[] = ["pathScanning", "genetic", "memetic", "vns", "compare"];

export default function AlgorithmSelector() {
  const mode = useAppStore((s) => s.algorithmMode);
  const setMode = useAppStore((s) => s.setAlgorithmMode);

  return (
    <select
      className="dropdown"
      value={mode}
      onChange={(e) => setMode(e.target.value as AlgorithmMode)}
    >
      {MODES.map((m) => (
        <option key={m} value={m}>
          {MODE_LABELS[m]}
        </option>
      ))}
    </select>
  );
}
