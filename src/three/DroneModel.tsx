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
  const discRefs = useRef<(THREE.Mesh | null)[]>([]);
  const spinRef = useRef(0);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    // 落地（非飞行状态）时螺旋桨平滑减速直至停止
    const airborne = AIRBORNE.has(simStore.get()?.status ?? "idle");
    spinRef.current += ((airborne ? 42 : 0) - spinRef.current) * Math.min(1, d * 3);
    propRefs.current.forEach((p, i) => {
      if (p) p.rotation.y += (i % 2 === 0 ? 1 : -1) * spinRef.current * d;
    });
    // 高速时叠加虚化盘透明度
    const discOpacity = Math.min(0.32, spinRef.current / 110);
    discRefs.current.forEach((m) => {
      if (m) (m.material as THREE.MeshStandardMaterial).opacity = discOpacity;
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
          <meshPhysicalMaterial
            color="#e8eae5"
            roughness={0.32}
            metalness={0.45}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
          />
        </mesh>
        {/* 座舱罩：半透玻璃 */}
        <mesh position={[0.1, 0.18, 0]} scale={[1, 0.7, 0.9]} castShadow>
          <sphereGeometry args={[0.42, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#dfe8ef"
            roughness={0.08}
            metalness={0}
            transmission={0.85}
            thickness={0.18}
            ior={1.45}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
        {/* 相机云台 */}
        <mesh position={[0.55, -0.18, 0]}>
          <sphereGeometry args={[0.16, 18, 14]} />
          <meshPhysicalMaterial
            color="#8b9296"
            roughness={0.35}
            metalness={0.7}
            clearcoat={0.4}
          />
        </mesh>
        {/* 料斗 + 喷口 */}
        <mesh position={[-0.05, -0.42, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.34, 0.55, 24]} />
          <meshPhysicalMaterial
            color="#f2f3f0"
            roughness={0.4}
            metalness={0.25}
            clearcoat={0.3}
          />
        </mesh>
        <mesh position={[-0.05, -0.78, 0]}>
          <coneGeometry args={[0.18, 0.28, 18]} />
          <meshPhysicalMaterial
            color="#d9a441"
            roughness={0.4}
            metalness={0.4}
            clearcoat={0.5}
          />
        </mesh>

        {/* 机臂 + 电机 + 螺旋桨 */}
        {MOTORS.map(([mx, mz], i) => {
          const armLen = Math.hypot(mx, mz);
          return (
            <group key={i}>
              <mesh position={[mx / 2, -0.02, mz / 2]} rotation={[0, -Math.atan2(mz, mx), 0]} castShadow>
                <boxGeometry args={[armLen, 0.1, 0.16]} />
                <meshPhysicalMaterial color="#8b9296" roughness={0.35} metalness={0.7} clearcoat={0.4} />
              </mesh>
              <mesh position={[mx, 0.08, mz]} castShadow>
                <cylinderGeometry args={[0.18, 0.2, 0.26, 18]} />
                <meshPhysicalMaterial color="#7c8288" roughness={0.4} metalness={0.7} clearcoat={0.3} />
              </mesh>
              <group position={[mx, 0.24, mz]} ref={(el) => (propRefs.current[i] = el)}>
                {/* 桨叶 */}
                <mesh>
                  <boxGeometry args={[1.7, 0.02, 0.14]} />
                  <meshPhysicalMaterial
                    color="#6f7679"
                    roughness={0.45}
                    metalness={0.3}
                    transparent
                    opacity={0.88}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[1.7, 0.02, 0.14]} />
                  <meshPhysicalMaterial
                    color="#6f7679"
                    roughness={0.45}
                    metalness={0.3}
                    transparent
                    opacity={0.88}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <mesh>
                  <cylinderGeometry args={[0.07, 0.07, 0.08, 12]} />
                  <meshPhysicalMaterial color="#7c8288" roughness={0.4} metalness={0.7} />
                </mesh>
              </group>
              {/* 高速虚化盘 */}
              <mesh
                ref={(el) => (discRefs.current[i] = el)}
                position={[mx, 0.24, mz]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.86, 0.86, 0.012, 28]} />
                <meshStandardMaterial
                  color="#9aa0a4"
                  transparent
                  opacity={0}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          );
        })}

        {/* 起落架 */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh position={[sx * 0.5, -0.85, 0]} castShadow>
              <boxGeometry args={[0.1, 0.1, 1.8]} />
              <meshPhysicalMaterial color="#7c8288" roughness={0.45} metalness={0.65} />
            </mesh>
            {[-0.6, 0.6].map((sz) => (
              <mesh key={sz} position={[sx * 0.5, -0.5, sz]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.7, 10]} />
                <meshPhysicalMaterial color="#7c8288" roughness={0.45} metalness={0.65} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
});

export default DroneModel;