import { useAppStore } from "../../store/appStore";
import type { Obstacle, Point2D, Scenario } from "../../types/domain";
import "./ScenarioPicker.css";

/** 取场景包围盒（含 depot，便于缩略图一致） */
function bounds(s: Scenario) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (p: Point2D) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  };
  s.fields.forEach((f) => f.polygon.forEach(visit));
  s.obstacles.forEach((o) => {
    if (o.type === "point" && o.position) visit(o.position);
    if (o.points) o.points.forEach(visit);
  });
  visit(s.depot);
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

/** 把场景点转成迷你 SVG 视图坐标（48×32 视口，留 4px 内边距） */
function project(p: Point2D, b: { minX: number; minY: number; w: number; h: number }) {
  const W = 48;
  const H = 32;
  const pad = 4;
  const sx = (W - pad * 2) / (b.w || 1);
  const sy = (H - pad * 2) / (b.h || 1);
  const s = Math.min(sx, sy);
  const ox = pad + ((W - pad * 2) - b.w * s) / 2;
  const oy = pad + ((H - pad * 2) - b.h * s) / 2;
  return { x: ox + (p.x - b.minX) * s, y: oy + (p.y - b.minY) * s };
}

function polygonPath(pts: Point2D[], b: { minX: number; minY: number; w: number; h: number }) {
  return pts
    .map((p, i) => {
      const q = project(p, b);
      return `${i === 0 ? "M" : "L"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

/** 场景迷你示意：所有田块轮廓 + 障碍点 + depot */
export function ScenarioThumb({ scenario }: { scenario: Scenario }) {
  const b = bounds(scenario);
  return (
    <svg
      className="sp-thumb"
      width="56"
      height="38"
      viewBox="0 0 48 32"
      aria-hidden="true"
    >
      {/* 田块 */}
      {scenario.fields.map((f, i) => (
        <path
          key={f.id}
          d={polygonPath(f.polygon, b)}
          fill={i % 2 ? "rgba(90,125,79,0.22)" : "rgba(90,125,79,0.30)"}
          stroke="var(--leaf-deep)"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      ))}
      {/* 多边形/线障碍 */}
      {scenario.obstacles.map((o) =>
        o.points && o.points.length > 1 ? (
          <polyline
            key={o.id}
            points={o.points
              .map((p) => {
                const q = project(p, b);
                return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
              })
              .join(" ")}
            fill="none"
            stroke="var(--danger)"
            strokeWidth="0.7"
            strokeDasharray="1.4 1.4"
          />
        ) : null
      )}
      {/* 点障碍 */}
      {scenario.obstacles
        .filter((o: Obstacle) => o.type === "point" && o.position)
        .map((o) => {
          if (!o.position) return null;
          const q = project(o.position, b);
          return (
            <circle
              key={o.id}
              cx={q.x}
              cy={q.y}
              r="1"
              fill="var(--danger)"
            />
          );
        })}
      {/* depot */}
      {(() => {
        const q = project(scenario.depot, b);
        return (
          <g>
            <circle cx={q.x} cy={q.y} r="1.6" fill="var(--seed-gold-deep)" />
            <circle cx={q.x} cy={q.y} r="0.8" fill="#fff" />
          </g>
        );
      })()}
    </svg>
  );
}

/** 场景选择器（场景预览与航线规划共用） */
export default function ScenarioPicker() {
  const scenarios = useAppStore((s) => s.scenarios);
  const currentId = useAppStore((s) => s.currentScenarioId);
  const setScenario = useAppStore((s) => s.setScenario);

  return (
    <div className="scenario-picker">
      {scenarios.map((s) => (
        <button
          key={s.id}
          className={"scenario-picker__item" + (s.id === currentId ? " is-active" : "")}
          onClick={() => setScenario(s.id)}
          title={s.description}
        >
          <ScenarioThumb scenario={s} />
          <span className="scenario-picker__meta">
            <span className="scenario-picker__name">{s.name}</span>
            <span className="scenario-picker__sub mono">
              {s.fields.length} 田 · {s.obstacles.length} 障碍
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}