import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import type { PlanOutput } from "../../algorithms";
import { MODE_SHORT } from "./labels";

const fmt = (n: number, d = 1) => n.toLocaleString("zh-CN", { maximumFractionDigits: d });

/** 取某算法收敛末点的综合成本（objective） */
export function compositeCost(output: PlanOutput, index: number): number {
  const conv = output.convergence[index];
  return conv && conv.length ? conv[conv.length - 1].objective : NaN;
}

export default function PlanResultPanel() {
  const navigate = useNavigate();
  const output = useAppStore((s) => s.planOutput);
  const selectedIndex = useAppStore((s) => s.selectedResultIndex);
  const selectResult = useAppStore((s) => s.selectResult);
  const setLastPlanResult = useAppStore((s) => s.setLastPlanResult);

  if (!output || output.results.length === 0) {
    return (
      <div className="result-panel">
        <span className="eyebrow">Result · 求解结果</span>
        <p className="result-panel__empty">配置参数并选择算法后，点击「生成航线」。</p>
      </div>
    );
  }

  const result = output.results[selectedIndex] ?? output.results[0];
  const composite = compositeCost(output, selectedIndex);
  const isCompare = output.results.length > 1;

  return (
    <div className="result-panel">
      <span className="eyebrow">Result · 求解结果</span>

      {isCompare && (
        <div className="result-tabs">
          {output.results.map((r, i) => (
            <button
              key={i}
              className={"result-tab" + (i === selectedIndex ? " is-active" : "")}
              onClick={() => selectResult(i)}
            >
              {MODE_SHORT[r.algorithm]}
            </button>
          ))}
        </div>
      )}

      <dl className="result-metrics">
        <Metric k="总飞行距离" v={`${fmt(result.totalDistance)} m`} />
        <Metric k="返航次数" v={`${result.returnCount}`} />
        <Metric k="覆盖率" v={`${fmt(result.coverageRate * 100)}%`} />
        <Metric k="运行时间" v={`${fmt(result.runtimeMs)} ms`} />
        <Metric k="约束违反" v={`${result.violations.length}`} highlight={result.violations.length > 0} />
        <Metric k="综合成本" v={fmt(composite)} />
      </dl>

      <div className={"result-feasible " + (result.feasible ? "ok" : "bad")}>
        {result.feasible ? (
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M4 10.5 L8 14.2 L16.2 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M6 6 L14 14 M14 6 L6 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        )}
        {result.feasible ? "可行解" : "存在不可行"}
      </div>

      {result.violations.length > 0 && (
        <ul className="result-violations">
          {result.violations.slice(0, 4).map((v, i) => (
            <li key={i}>
              <span className="result-violation__dot" aria-hidden="true" />
              {v.message}
            </li>
          ))}
          {result.violations.length > 4 && (
            <li className="result-violation__more">…等 {result.violations.length} 项</li>
          )}
        </ul>
      )}

      <div className="result-actions">
        <button
          className="btn-primary"
          onClick={() => {
            setLastPlanResult(result);
            navigate("/simulation");
          }}
        >
          进入播种模拟 <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}

function Metric({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="result-metric">
      <dt>{k}</dt>
      <dd className={"mono" + (highlight ? " is-bad" : "")}>{v}</dd>
    </div>
  );
}
