import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type { Obstacle, Point2D } from "../types/domain";
import { to3 } from "./coords";

const WARN = "#e0533d";

export default function ObstacleRenderer({ obstacles }: { obstacles: Obstacle[] }) {
  return (
    <group>
      {obstacles.map((o) => (
        <ObstacleItem key={o.id} obstacle={o} />
      ))}
    </group>
  );
}

function ObstacleItem({ obstacle: o }: { obstacle: Obstacle }) {
  if (o.type === "point" && o.position) return <PolePoint o={o} pos={o.position} />;
  if (o.type === "line" && o.points && o.points.length >= 2) return <PowerLine pts={o.points} buffer={o.buffer ?? 2} />;
  if (o.type === "polygon" && o.points && o.points.length >= 3) {
    const water = /水|塘|沟|渠/.test(o.label);
    return water ? <WaterArea pts={o.points} /> : <NoFlyArea pts={o.points} />;
  }
  return null;
}

/** 点状障碍：电塔（粗高）或电线杆（细），底部安全缓冲环 */
function PolePoint({ o, pos }: { o: Obstacle; pos: Point2D }) {
  const isTower = /塔/.test(o.label);
  const p = to3(pos, 0).toArray() as [number, number, number];
  const buffer = (o.radius ?? 0) + (o.buffer ?? 0);
  const h = isTower ? 11 : 7;

  return (
    <group position={p}>
      {buffer > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <circleGeometry args={[buffer, 40]} />
          <meshBasicMaterial color={WARN} transparent opacity={0.16} depthWrite={false} />
        </mesh>
      )}
      {/* 杆体 */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={isTower ? [1.0, 1.9, h, 8] : [0.32, 0.46, h, 10]} />
        <meshStandardMaterial color={isTower ? "#8a8f96" : "#cfcfcf"} roughness={0.8} metalness={isTower ? 0.4 : 0.1} />
      </mesh>
      {/* 横担 */}
      <mesh position={[0, h - 0.8, 0]} castShadow>
        <boxGeometry args={[isTower ? 6 : 3.2, 0.22, 0.32]} />
        <meshStandardMaterial color={isTower ? "#71767d" : "#b9b9b9"} roughness={0.85} metalness={0.3} />
      </mesh>
      {/* 绝缘子 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (isTower ? 2.6 : 1.4), h - 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 0.4, 8]} />
          <meshStandardMaterial color="#e8e4da" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
      {isTower && (
        <mesh position={[0, h - 2.4, 0]} castShadow>
          <boxGeometry args={[4.6, 0.22, 0.32]} />
          <meshStandardMaterial color="#71767d" roughness={0.85} metalness={0.3} />
        </mesh>
      )}
    </group>
  );
}

/** 架空线缆：抬高折线 + 地面安全缓冲带 */
function PowerLine({ pts, buffer }: { pts: Point2D[]; buffer: number }) {
  const cable = useMemo(
    () => pts.map((p) => to3(p, 9.5).toArray() as [number, number, number]),
    [pts]
  );
  const ground = useMemo(
    () => pts.map((p) => to3(p, 0.06).toArray() as [number, number, number]),
    [pts]
  );
  return (
    <group>
      <Line points={ground} color={WARN} lineWidth={buffer * 2} worldUnits transparent opacity={0.16} />
      <Line points={cable} color="#2b2f33" lineWidth={0.18} worldUnits />
    </group>
  );
}

function shapeFrom(pts: Point2D[]): THREE.Shape {
  const s = new THREE.Shape();
  pts.forEach((p, i) => (i === 0 ? s.moveTo(p.x, p.y) : s.lineTo(p.x, p.y)));
  s.closePath();
  return s;
}

/** 水塘：水面 + 土堤描边 */
function WaterArea({ pts }: { pts: Point2D[] }) {
  const shape = useMemo(() => shapeFrom(pts), [pts]);
  const rim = useMemo(
    () => [...pts, pts[0]].map((p) => to3(p, 0.08).toArray() as [number, number, number]),
    [pts]
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#2f6f97" roughness={0.12} metalness={0.1} transparent opacity={0.92} />
      </mesh>
      <Line points={rim} color="#3a2c1c" lineWidth={2.4} />
    </group>
  );
}

/** 禁飞区：红橙半透明面 + 虚线边界 */
function NoFlyArea({ pts }: { pts: Point2D[] }) {
  const shape = useMemo(() => shapeFrom(pts), [pts]);
  const outline = useMemo(
    () => [...pts, pts[0]].map((p) => to3(p, 0.1).toArray() as [number, number, number]),
    [pts]
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color={WARN} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={outline} color={WARN} lineWidth={1.8} dashed dashSize={1.2} gapSize={0.8} />
    </group>
  );
}
