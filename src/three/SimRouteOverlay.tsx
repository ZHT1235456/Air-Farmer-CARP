import { useMemo, useSyncExternalStore } from "react";
import * as THREE from "three";
import { Line, Text, Billboard } from "@react-three/drei";
import type { PlanResult, Strip } from "../types/domain";
import { simStore } from "../simulation/simStore";
import { segmentTransform, to3 } from "./coords";

const SEEDED_Y = 0.1;
const CURRENT_Y = 0.16;
const EDGE_Y = 0.2;
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
 * 仿真航带逐趟展示：已播种航带墨绿贴地覆盖；仅高亮当前趟待播航带，
 * 并在当前趟标注 Rn。切到下一趟时自动更新。
 * 用贴地 plane 取代 box，俯视/斜视均能看到完整色面。
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
      {/* 已播种航带：墨绿贴地覆盖 */}
      {[...seeded].map((id) => {
        const s = stripMap.get(id);
        if (!s) return null;
        const t = segmentTransform(s.start, s.end, SEEDED_Y);
        return (
          <mesh
            key={`seed-${id}`}
            position={t.position}
            rotation={[-Math.PI / 2, 0, t.rotationY]}
          >
            <planeGeometry args={[t.length, 1.7]} />
            <meshStandardMaterial
              color="#2f6d22"
              roughness={0.85}
              emissive="#1f4a16"
              emissiveIntensity={0.18}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
            />
          </mesh>
        );
      })}

{/* 当前趟待播航带：金/趟色贴地高亮（不透明，避免 snapshot 重渲染时透明排序抖动） */}
      {currentRoute?.strips.map((s) => {
        if (seeded.has(s.id)) return null;
        const t = segmentTransform(s.start, s.end, CURRENT_Y);
        const isCurrent = s.id === currentId;
        const w = isCurrent ? 2.4 : 1.9;
        return (
          <mesh
            key={`cur-${s.id}`}
            position={t.position}
            rotation={[-Math.PI / 2, 0, t.rotationY]}
          >
            <planeGeometry args={[t.length, w]} />
            <meshStandardMaterial
              color={isCurrent ? "#f0c460" : tripColor}
              emissive={isCurrent ? "#d9a441" : tripColor}
              emissiveIntensity={isCurrent ? 0.5 : 0.22}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-3}
              polygonOffsetUnits={-3}
            />
          </mesh>
        );
      })}

      {/* 当前条发光描边：补偿贴纸无厚度感，斜视更醒目 */}
      {currentRoute?.strips
        .filter((s) => s.id === currentId)
        .map((s) => {
          const a = to3(s.start, EDGE_Y).toArray() as [number, number, number];
          const b = to3(s.end, EDGE_Y).toArray() as [number, number, number];
          return (
            <Line
              key={`edge-${s.id}`}
              points={[a, b]}
              color="#f0c460"
              lineWidth={3}
              worldUnits
              transparent
              opacity={0.9}
            />
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
