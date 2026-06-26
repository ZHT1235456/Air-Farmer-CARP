import { useMemo, useState } from "react";
import type { AlgorithmMode } from "../../types/domain";
import type { PlanOutput } from "../../algorithms";
import { ALGO_COLORS, MODE_SHORT } from "./labels";

const W = 360;
const H = 200;
const PAD = { l: 44, r: 14, t: 16, b: 30 };
const ROWS = 4; // y 网格行数
const COLS = 4; // x 网格列数

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

  const [hidden, setHidden] = useState<Set<AlgorithmMode>>(new Set());
  const [hoverX, setHoverX] = useState<number | null>(null);

  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const sx = (it: number) => PAD.l + (it / xMax) * innerW;
  const sy = (obj: number) =>
    PAD.t + (1 - (obj - yMin) / (yMax - yMin)) * innerH;

  // y/x 网格刻度
  const yTicks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= ROWS; i++) {
      const v = yMin + (i / ROWS) * (yMax - yMin);
      arr.push(v);
    }
    return arr;
  }, [yMin, yMax]);
  const xTicks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= COLS; i++) arr.push((i / COLS) * xMax);
    return arr;
  }, [xMax]);

  // 鼠标移入 SVG 后查找最近迭代值
  const handleMove = (e: React.MouseEvent<SVGElement>) => {
    const svg = e.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    if (px < PAD.l || px > W - PAD.r) {
      setHoverX(null);
      return;
    }
    const it = ((px - PAD.l) / innerW) * xMax;
    setHoverX(Math.max(0, Math.min(xMax, it)));
  };

  // 在每条可见线上找出最接近 hoverX 的点
  const hoverPoints = useMemo(() => {
    if (hoverX === null) return [];
    return series
      .filter((s) => !hidden.has(s.mode) && s.points.length > 0)
      .map((s) => {
        let best = s.points[0];
        let bd = Math.abs(best.iteration - hoverX);
        for (let i = 1; i < s.points.length; i++) {
          const d = Math.abs(s.points[i].iteration - hoverX);
          if (d < bd) {
            bd = d;
            best = s.points[i];
          }
        }
        return { mode: s.mode, point: best };
      });
  }, [hoverX, series, hidden]);

  const toggle = (m: AlgorithmMode) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  return (
    <div className="conv-chart card">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="conv-chart__svg"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverX(null)}
      >
        {/* y 网格线 + 刻度 */}
        {yTicks.map((v, i) => {
          const y = sy(v);
          return (
            <g key={`y${i}`}>
              <line
                x1={PAD.l}
                y1={y}
                x2={W - PAD.r}
                y2={y}
                className="conv-grid"
              />
              <text x={PAD.l - 6} y={y + 3} className="conv-tick" textAnchor="end">
                {Math.round(v)}
              </text>
            </g>
          );
        })}
        {/* x 网格线 + 刻度 */}
        {xTicks.map((v, i) => {
          const x = sx(v);
          return (
            <g key={`x${i}`}>
              <line
                x1={x}
                y1={PAD.t}
                x2={x}
                y2={H - PAD.b}
                className="conv-grid"
              />
              <text
                x={x}
                y={H - PAD.b + 14}
                className="conv-tick"
                textAnchor="middle"
              >
                {Math.round(v)}
              </text>
            </g>
          );
        })}

        {/* 轴 */}
        <line
          x1={PAD.l}
          y1={PAD.t}
          x2={PAD.l}
          y2={H - PAD.b}
          className="conv-axis"
        />
        <line
          x1={PAD.l}
          y1={H - PAD.b}
          x2={W - PAD.r}
          y2={H - PAD.b}
          className="conv-axis"
        />
        <text x={W / 2} y={H - 2} className="conv-tick conv-tick--x" textAnchor="middle">
          迭代 →
        </text>

        {/* 折线 + 入场描边动画 */}
        {series.map((s, i) => {
          if (hidden.has(s.mode) || s.points.length === 0) return null;
          const color = ALGO_COLORS[s.mode];
          const d = s.points
            .map((p, j) => `${j === 0 ? "M" : "L"} ${sx(p.iteration).toFixed(1)} ${sy(p.objective).toFixed(1)}`)
            .join(" ");
          const pathLen = Math.max(1, s.points.length * 60);
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="conv-line"
              style={{ strokeDasharray: pathLen, strokeDashoffset: pathLen }}
            />
          );
        })}

        {/* hover 引导线 + 数据点 */}
        {hoverX !== null && (
          <line
            x1={sx(hoverX)}
            y1={PAD.t}
            x2={sx(hoverX)}
            y2={H - PAD.b}
            className="conv-hover-line"
          />
        )}
        {hoverPoints.map(({ mode, point }, i) => (
          <circle
            key={i}
            cx={sx(point.iteration)}
            cy={sy(point.objective)}
            r={3.2}
            className="conv-hover-dot"
            style={{ fill: ALGO_COLORS[mode] }}
          />
        ))}
      </svg>

      <div className="conv-legend">
        {series.map((s, i) => {
          const off = hidden.has(s.mode);
          return (
            <button
              key={i}
              type="button"
              className={"conv-legend__item" + (off ? " is-off" : "")}
              onClick={() => toggle(s.mode)}
              title={off ? "点击显示" : "点击隐藏"}
            >
              <span className="conv-legend__dot" style={{ background: ALGO_COLORS[s.mode] }} />
              {MODE_SHORT[s.mode]}
            </button>
          );
        })}
      </div>

      {hoverX !== null && hoverPoints.length > 0 && (
        <div className="conv-tip">
          <span className="conv-tip__label mono">迭代 {Math.round(hoverX)}</span>
          {hoverPoints.map(({ mode, point }, i) => (
            <span key={i} className="conv-tip__row mono">
              <span className="conv-tip__dot" style={{ background: ALGO_COLORS[mode] }} />
              {MODE_SHORT[mode]}
              <span className="conv-tip__val">{point.objective.toFixed(2)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}