import { useAppStore } from "../../store/appStore";
import type { AlgorithmMode } from "../../types/domain";
import "./AlgorithmSelector.css";

const MODES: { id: AlgorithmMode; name: string; kind: string; pk?: boolean }[] = [
  { id: "pathScanning", name: "Path Scanning", kind: "快速构造" },
  { id: "genetic", name: "遗传算法", kind: "元启发式" },
  { id: "memetic", name: "MemeticGA", kind: "高质量" },
  { id: "vns", name: "VNS", kind: "局部改进" },
  { id: "compare", name: "对比模式", kind: "全部算法", pk: true },
];

export default function AlgorithmSelector() {
  const mode = useAppStore((s) => s.algorithmMode);
  const setMode = useAppStore((s) => s.setAlgorithmMode);

  return (
    <div className="algo-selector" role="radiogroup" aria-label="算法模式">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={mode === m.id}
          className={"algo-pill" + (mode === m.id ? " is-active" : "")}
          onClick={() => setMode(m.id)}
        >
          <span className="algo-pill__row">
            <span className="algo-pill__name">{m.name}</span>
            {m.pk && <span className="algo-pill__pk mono">PK</span>}
          </span>
          <span className="algo-pill__kind mono">{m.kind}</span>
        </button>
      ))}
    </div>
  );
}