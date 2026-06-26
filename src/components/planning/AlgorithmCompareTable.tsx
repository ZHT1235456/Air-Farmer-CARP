import { useAppStore } from "../../store/appStore";
import type { PlanOutput } from "../../algorithms";
import { MODE_SHORT } from "./labels";
import { compositeCost } from "./PlanResultPanel";

const fmt = (n: number, d = 1) => n.toLocaleString("zh-CN", { maximumFractionDigits: d });

export default function AlgorithmCompareTable({ output }: { output: PlanOutput }) {
  const selectResult = useAppStore((s) => s.selectResult);
  const selectedIndex = useAppStore((s) => s.selectedResultIndex);

  // 找综合成本最小者高亮
  const composites = output.results.map((_, i) => compositeCost(output, i));
  let bestIdx = 0;
  composites.forEach((c, i) => {
    if (c < composites[bestIdx]) bestIdx = i;
  });

  return (
    <table className="compare-table">
      <thead>
        <tr>
          <th>算法</th>
          <th>总航程</th>
          <th>返航</th>
          <th>覆盖率</th>
          <th>耗时(ms)</th>
          <th>违反</th>
          <th>综合成本</th>
        </tr>
      </thead>
      <tbody>
        {output.results.map((r, i) => (
          <tr
            key={i}
            className={
              (i === selectedIndex ? "is-selected " : "") + (i === bestIdx ? "is-best" : "")
            }
            onClick={() => selectResult(i)}
          >
            <td>{MODE_SHORT[r.algorithm]}</td>
            <td className="mono">{fmt(r.totalDistance)}</td>
            <td className="mono">{r.returnCount}</td>
            <td className="mono">{fmt(r.coverageRate * 100)}%</td>
            <td className="mono">{fmt(r.runtimeMs)}</td>
            <td className="mono">{r.violations.length}</td>
            <td className="mono">{fmt(composites[i])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
