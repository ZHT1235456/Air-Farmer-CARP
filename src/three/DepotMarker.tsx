import type { Point2D } from "../types/domain";
import { to3 } from "./coords";

/** 起降补给点：停机坪 + 种子料仓 + 旗（料仓站风格） */
export default function DepotMarker({ depot }: { depot: Point2D }) {
  const pos = to3(depot, 0).toArray() as [number, number, number];
  return (
    <group position={pos}>
      {/* 停机坪 */}
      <mesh position={[0, 0.13, 0]} receiveShadow>
        <cylinderGeometry args={[4, 4.2, 0.26, 40]} />
        <meshStandardMaterial color="#33373c" roughness={0.78} metalness={0.3} />
      </mesh>
      {/* 着陆白环 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.27, 0]}>
        <ringGeometry args={[3.3, 3.7, 48]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.45} metalness={0.25} side={2} />
      </mesh>

      {/* 料仓（置于 3 点钟方向，避免压住停机坪中心） */}
      <group position={[5.5, 0, 0]}>
        {/* 桶体 */}
        <mesh position={[0, 2.6, 0]} castShadow>
          <cylinderGeometry args={[1.6, 1.6, 3.2, 24]} />
          <meshStandardMaterial color="#b9c2c8" roughness={0.35} metalness={0.65} />
        </mesh>
        {/* 漏斗 */}
        <mesh position={[0, 1.3, 0]} castShadow>
          <coneGeometry args={[1.6, 1.4, 24]} />
          <meshStandardMaterial color="#b9c2c8" roughness={0.35} metalness={0.65} />
        </mesh>
        {/* 顶盖 */}
        <mesh position={[0, 4.7, 0]} castShadow>
          <coneGeometry args={[1.8, 1.0, 24]} />
          <meshStandardMaterial color="#8a949b" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* 四条支腿 */}
        {[45, 135, 225, 315].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return (
            <mesh key={deg} position={[Math.cos(a) * 1.2, 1.1, Math.sin(a) * 1.2]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 2.2, 8]} />
              <meshStandardMaterial color="#6b7177" roughness={0.45} metalness={0.75} />
            </mesh>
          );
        })}
      </group>

      {/* 旗杆 + 旗 */}
      <mesh position={[-4, 2.5, 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
        <meshStandardMaterial color="#cccccc" roughness={0.4} metalness={0.75} />
      </mesh>
      <mesh position={[-3.2, 4.4, 2]}>
        <planeGeometry args={[1.6, 0.9]} />
        <meshStandardMaterial color="#e0533d" roughness={0.7} side={2} />
      </mesh>
    </group>
  );
}
