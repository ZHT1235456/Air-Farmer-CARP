import { useMemo } from "react";
import type { PlanOutput } from "../../algorithms";
import { ALGO_COLORS, MODE_SHORT } from "./labels";

const W = 360;
const H = 190;
const PAD = { l: 44, r: 12, t: 14, b: 26 };

/** 自绘 SVG 收敛曲线：目标值随迭代下降，多算法多条线 */
export default function ConvergenceChart({ output }: { output: PlanOutput }) {
  const { series, xMax, yMin, yMax } = useMemo(() => {
    let xMax = 1;
    let yMin = Infinity;
    let yMax = -Infinity;
    const series = output.convergence.map((conv, i) => {
      conv.forEach((p) => {
        if (p.iteration > xMax) xMax = p.iteration;
        if (p.objective < yMin) yMin = p.objective;
        if (p.objective > yMax) yMax = p.objective;
      });
      return { mode: output.results[i]?.algorithm ?? "compare", points: conv };
    });
    if (!isFinite(yMin)) {
      yMin = 0;
      yMax = 1;
    }
    if (yMax - yMin < 1e-9) yMax = yMin + 1;
    return { series, xMax, yMin, yMax };
  }, [output]);

  const sx = (it: number) => PAD.l + (it / xMax) * (W - PAD.l - PAD.r);
  const sy = (obj: number) => PAD.t + (1 - (obj - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  return (
    <div className="conv-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="conv-chart__svg">
        {/* 轴 */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} className="conv-axis" />
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="conv-axis" />
        {/* y 轴端点标注 */}
        <text x={PAD.l - 6} y={PAD.t + 4} className="conv-tick" textAnchor="end">
          {Math.round(yMax)}
        </text>
        <text x={PAD.l - 6} y={H - PAD.b} className="conv-tick" textAnchor="end">
          {Math.round(yMin)}
        </text>
        <text x={(W) / 2} y={H - 4} className="conv-tick" textAnchor="middle">
          迭代 →
        </text>

        {series.map((s, i) => {
          if (s.points.length === 0) return null;
          const color = ALGO_COLORS[s.mode];
          const d = s.points
            .map((p, j) => `${j === 0 ? "M" : "L"} ${sx(p.iteration).toFixed(1)} ${sy(p.objective).toFixed(1)}`)
            .join(" ");
          return <path key={i} d={d} fill="none" stroke={color} strokeWidth={1.8} />;
        })}
      </svg>

      <div className="conv-legend">
        {series.map((s, i) => (
          <span key={i} className="conv-legend__item">
            <span className="conv-legend__dot" style={{ background: ALGO_COLORS[s.mode] }} />
            {MODE_SHORT[s.mode]}
          </span>
        ))}
      </div>
    </div>
  );
}
