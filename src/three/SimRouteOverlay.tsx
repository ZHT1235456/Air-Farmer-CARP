import { useMemo, useSyncExternalStore } from "react";
import { Text, Billboard } from "@react-three/drei";
import type { PlanResult, Strip } from "../types/domain";
import { simStore } from "../simulation/simStore";
import { segmentTransform, to3 } from "./coords";

const SEEDED_Y = 0.13;
const CURRENT_Y = 0.18;
const LABEL_Y = 4.5;

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

/**
 * 仿真航带逐趟展示：已播种航带墨绿覆盖；仅高亮当前趟待播航带，
 * 并在当前趟标注 Rn。切到下一趟时自动更新。
 */
export default function SimRouteOverlay({ plan }: { plan: PlanResult }) {
  const snap = useSyncExternalStore(simStore.subscribe, simStore.get, simStore.get);
  const stripMap = useMemo(() => {
    const m = new Map<string, Strip>();
    for (const r of plan.routes) for (const s of r.strips) m.set(s.id, s);
    return m;
  }, [plan]);

  const seeded = snap?.seededStripIds ?? new Set<string>();
  const routeIndex = Math.min(snap?.currentRouteIndex ?? 0, plan.routes.length - 1);
  const currentRoute = plan.routes[routeIndex];
  const currentId = snap?.currentStripId ?? null;
  const tripColor = TRIP_PALETTE[routeIndex % TRIP_PALETTE.length];

  // 当前趟标签位置：该趟首条航带中点上方
  const labelPos = useMemo(() => {
    const s = currentRoute?.strips[0];
    if (!s) return null;
    const mid = { x: (s.start.x + s.end.x) / 2, y: (s.start.y + s.end.y) / 2 };
    return to3(mid, LABEL_Y).toArray() as [number, number, number];
  }, [currentRoute]);

  return (
    <group>
      {/* 已播种航带：墨绿覆盖 */}
      {[...seeded].map((id) => {
        const s = stripMap.get(id);
        if (!s) return null;
        const t = segmentTransform(s.start, s.end, SEEDED_Y);
        return (
          <mesh key={`seed-${id}`} position={t.position} rotation={[0, t.rotationY, 0]}>
            <boxGeometry args={[t.length, 0.08, 1.7]} />
            <meshStandardMaterial color="#2f6d22" roughness={0.85} emissive="#1f4a16" emissiveIntensity={0.15} />
          </mesh>
        );
      })}

      {/* 当前趟待播航带：金/趟色高亮 */}
      {currentRoute?.strips.map((s) => {
        if (seeded.has(s.id)) return null;
        const t = segmentTransform(s.start, s.end, CURRENT_Y);
        const isCurrent = s.id === currentId;
        return (
          <mesh key={`cur-${s.id}`} position={t.position} rotation={[0, t.rotationY, 0]}>
            <boxGeometry args={[t.length, isCurrent ? 0.12 : 0.1, isCurrent ? 2.4 : 1.9]} />
            <meshStandardMaterial
              color={isCurrent ? "#f0c460" : tripColor}
              emissive={isCurrent ? "#d9a441" : tripColor}
              emissiveIntensity={isCurrent ? 0.6 : 0.3}
              transparent={!isCurrent}
              opacity={isCurrent ? 1 : 0.7}
            />
          </mesh>
        );
      })}

      {/* 当前趟标签 Rn */}
      {labelPos && (
        <Billboard position={labelPos}>
          <mesh>
            <circleGeometry args={[1.1, 24]} />
            <meshBasicMaterial color={tripColor} />
          </mesh>
          <Text fontSize={1.3} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.06} outlineColor="rgba(0,0,0,0.35)">
            {`R${routeIndex + 1}`}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
