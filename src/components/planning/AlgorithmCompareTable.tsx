import { useAppStore } from "../../store/appStore";
import type { PlanOutput } from "../../algorithms";
import { MODE_SHORT } from "./labels";
import { compositeCost } from "./PlanResultPanel";

const fmt = (n: number, d = 1) => n.toLocaleString("zh-CN", { maximumFractionDigits: d });

const EPS = 1e-9;

/** 找到能区分各综合成本的最小小数位数（最多 6 位） */
function distinguishingPrecision(vals: number[]): number {
  for (let d = 1; d <= 6; d++) {
    let ok = true;
    for (let i = 0; i < vals.length && ok; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        if (Math.abs(vals[i] - vals[j]) > EPS && vals[i].toFixed(d) === vals[j].toFixed(d)) {
          ok = false;
          break;
        }
      }
    }
    if (ok) return d;
  }
  return 6;
}

export default function AlgorithmCompareTable({ output }: { output: PlanOutput }) {
  const selectResult = useAppStore((s) => s.selectResult);
  const selectedIndex = useAppStore((s) => s.selectedResultIndex);

  const composites = output.results.map((_, i) => compositeCost(output, i));
  const precision = distinguishingPrecision(composites);

  // 综合成本严格最小者最优；完全相等时取运行时间最短
  let bestIdx = 0;
  output.results.forEach((r, i) => {
    const c = composites[i];
    const bc = composites[bestIdx];
    const better =
      c < bc - EPS ||
      (Math.abs(c - bc) <= EPS && r.runtimeMs < output.results[bestIdx].runtimeMs);
    if (better) bestIdx = i;
  });

  return (
    <div className="compare-wrap">
      <div className="compare-bar">
        <span className="compare-hint mono">
          最优行以金色描边标注 · 点击行查看详情
        </span>
      </div>
      <table className="compare-table">
        <thead>
          <tr>
            <th>算法</th>
            <th>总航程 m</th>
            <th>返航</th>
            <th>覆盖率</th>
            <th>耗时 ms</th>
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
              <td className="compare-algo">{MODE_SHORT[r.algorithm]}</td>
              <td className="mono">{fmt(r.totalDistance)}</td>
              <td className="mono">{r.returnCount}</td>
              <td className="mono">{fmt(r.coverageRate * 100)}%</td>
              <td className="mono">{fmt(r.runtimeMs)}</td>
              <td className="mono">{r.violations.length}</td>
              <td className="mono compare-cost">{composites[i].toFixed(precision)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
