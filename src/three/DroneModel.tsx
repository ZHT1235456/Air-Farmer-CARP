import { forwardRef, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { simStore } from "../simulation/simStore";

const AIRBORNE = new Set(["running", "seeding", "returning"]);

const MOTORS: [number, number][] = [
  [1.05, 1.05],
  [1.05, -1.05],
  [-1.05, -1.05],
  [-1.05, 1.05],
];

/** 四旋翼播种无人机（移植参考 Drone.ts）。外层 group 由调用方 setPose；内部螺旋桨旋转 + 悬停浮动 */
const DroneModel = forwardRef<THREE.Group>(function DroneModel(_props, ref) {
  const craftRef = useRef<THREE.Group>(null);
  const propRefs = useRef<(THREE.Group | null)[]>([]);
  const spinRef = useRef(0);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    // 落地（非飞行状态）时螺旋桨平滑减速直至停止
    const airborne = AIRBORNE.has(simStore.get()?.status ?? "idle");
    spinRef.current += ((airborne ? 42 : 0) - spinRef.current) * Math.min(1, d * 3);
    propRefs.current.forEach((p, i) => {
      if (p) p.rotation.y += (i % 2 === 0 ? 1 : -1) * spinRef.current * d;
    });
    const e = state.clock.elapsedTime;
    if (craftRef.current) {
      craftRef.current.position.y = Math.sin(e * 2.2) * 0.06;
      craftRef.current.rotation.z = Math.sin(e * 1.3) * 0.01;
    }
  });

  return (
    <group ref={ref}>
      <group ref={craftRef} scale={0.68}>
        {/* 机身 */}
        <mesh castShadow>
          <boxGeometry args={[1.3, 0.36, 1.0]} />
          <meshStandardMaterial color="#e8eae5" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* 座舱罩 */}
        <mesh position={[0.1, 0.18, 0]} scale={[1, 0.7, 0.9]} castShadow>
          <sphereGeometry args={[0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e8eae5" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* 相机云台 */}
        <mesh position={[0.55, -0.18, 0]}>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshStandardMaterial color="#aeb4b2" roughness={0.55} metalness={0.5} />
        </mesh>
        {/* 料斗 + 喷口 */}
        <mesh position={[-0.05, -0.42, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.34, 0.55, 20]} />
          <meshStandardMaterial color="#f2f3f0" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[-0.05, -0.78, 0]}>
          <coneGeometry args={[0.18, 0.28, 16]} />
          <meshStandardMaterial color="#d9a441" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* 机臂 + 电机 + 螺旋桨 */}
        {MOTORS.map(([mx, mz], i) => {
          const armLen = Math.hypot(mx, mz);
          return (
            <group key={i}>
              <mesh position={[mx / 2, -0.02, mz / 2]} rotation={[0, -Math.atan2(mz, mx), 0]} castShadow>
                <boxGeometry args={[armLen, 0.1, 0.16]} />
                <meshStandardMaterial color="#aeb4b2" roughness={0.55} metalness={0.5} />
              </mesh>
              <mesh position={[mx, 0.08, mz]} castShadow>
                <cylinderGeometry args={[0.18, 0.2, 0.26, 16]} />
                <meshStandardMaterial color="#aeb4b2" roughness={0.55} metalness={0.5} />
              </mesh>
              <group position={[mx, 0.24, mz]} ref={(el) => (propRefs.current[i] = el)}>
                <mesh>
                  <boxGeometry args={[1.7, 0.02, 0.16]} />
                  <meshStandardMaterial color="#8a9095" roughness={0.4} metalness={0.3} transparent opacity={0.85} side={THREE.DoubleSide} />
                </mesh>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[1.7, 0.02, 0.16]} />
                  <meshStandardMaterial color="#8a9095" roughness={0.4} metalness={0.3} transparent opacity={0.85} side={THREE.DoubleSide} />
                </mesh>
                <mesh>
                  <cylinderGeometry args={[0.08, 0.08, 0.08, 10]} />
                  <meshStandardMaterial color="#aeb4b2" roughness={0.55} metalness={0.5} />
                </mesh>
              </group>
            </group>
          );
        })}

        {/* 起落架 */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh position={[sx * 0.5, -0.85, 0]} castShadow>
              <boxGeometry args={[0.1, 0.1, 1.8]} />
              <meshStandardMaterial color="#aeb4b2" roughness={0.55} metalness={0.5} />
            </mesh>
            {[-0.6, 0.6].map((sz) => (
              <mesh key={sz} position={[sx * 0.5, -0.5, sz]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
                <meshStandardMaterial color="#aeb4b2" roughness={0.55} metalness={0.5} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
});

export default DroneModel;
