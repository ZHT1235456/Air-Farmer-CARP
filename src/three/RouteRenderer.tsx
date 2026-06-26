import { useMemo } from "react";
import { Line, Text, Billboard } from "@react-three/drei";
import type { PlanResult, RouteSegment } from "../types/domain";
import { to3 } from "./coords";

const ROUTE_Y = 0.35;
const LABEL_Y = 5;

/** 分趟配色（发光线条） */
const TRIP_PALETTE = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#eab308",
];

type Pt = [number, number, number];

/** 三维航线：按趟配色，服务段实线/空飞转移虚线/返航段区分，并标注 R1/R2… 轮次 */
export default function RouteRenderer({ plan }: { plan: PlanResult | null }) {
  const groups = useMemo(() => groupByRoute(plan?.routeSegments ?? []), [plan]);

  if (!plan) return null;

  return (
    <group>
      {groups.map((segs, tripIndex) => {
        const color = TRIP_PALETTE[tripIndex % TRIP_PALETTE.length];
        const label = labelPosition(segs);
        return (
          <group key={tripIndex}>
            {segs.map((s) => {
              const pts: Pt[] = [
                to3(s.from, ROUTE_Y).toArray() as Pt,
                to3(s.to, ROUTE_Y).toArray() as Pt,
              ];
              if (s.type === "service") {
                return (
                  <group key={s.id}>
                    <Line points={pts} color={color} lineWidth={1.6} worldUnits transparent opacity={0.25} />
                    <Line points={pts} color={color} lineWidth={0.6} worldUnits />
                  </group>
                );
              }
              if (s.type === "return") {
                return (
                  <Line key={s.id} points={pts} color={color} lineWidth={0.28} worldUnits dashed dashSize={2.4} gapSize={1.2} opacity={0.8} transparent />
                );
              }
              return (
                <Line key={s.id} points={pts} color={color} lineWidth={0.22} worldUnits dashed dashSize={1.0} gapSize={1.0} opacity={0.6} transparent />
              );
            })}

            {label && (
              <Billboard position={label}>
                <mesh>
                  <circleGeometry args={[1.1, 24]} />
                  <meshBasicMaterial color={color} />
                </mesh>
                <Text fontSize={1.3} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.06} outlineColor="rgba(0,0,0,0.35)">
                  {`R${tripIndex + 1}`}
                </Text>
              </Billboard>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** 该趟标签位置：首个服务段中点上方 */
function labelPosition(segs: RouteSegment[]): Pt | null {
  const s = segs.find((x) => x.type === "service") ?? segs[0];
  if (!s) return null;
  const mid = { x: (s.from.x + s.to.x) / 2, y: (s.from.y + s.to.y) / 2 };
  return to3(mid, LABEL_Y).toArray() as Pt;
}

function groupByRoute(segments: RouteSegment[]): RouteSegment[][] {
  const map = new Map<string, RouteSegment[]>();
  for (const s of segments) {
    let arr = map.get(s.routeId);
    if (!arr) {
      arr = [];
      map.set(s.routeId, arr);
    }
    arr.push(s);
  }
  return [...map.values()];
}
