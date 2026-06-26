import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const GRAVITY = 9.8;
const GROUND_Y = 0.15;
const dummy = new THREE.Object3D();

interface Props {
  count?: number;
  /** 喷口世界位置（每帧由驱动器更新） */
  emitterRef: MutableRefObject<THREE.Vector3>;
  /** 是否正在播种（每帧由驱动器更新） */
  activeRef: MutableRefObject<boolean>;
}

/** 喷口下落的种子粒子（重力，落地回收），仅播种时可见 */
export default function SeedingEffect({ count = 140, emitterRef, activeRef }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pos = useMemo(() => Array.from({ length: count }, () => new THREE.Vector3()), [count]);
  const vel = useMemo(() => Array.from({ length: count }, () => new THREE.Vector3()), [count]);

  const respawn = (i: number, stagger: boolean) => {
    const e = emitterRef.current;
    pos[i].set(e.x + (Math.random() - 0.5) * 0.5, e.y - (stagger ? Math.random() * 4 : 0), e.z + (Math.random() - 0.5) * 0.5);
    vel[i].set((Math.random() - 0.5) * 1.6, -1.5 - Math.random() * 1.8, (Math.random() - 0.5) * 1.6);
  };

  useFrame((_s, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const active = activeRef.current;
    mesh.visible = active;
    if (!active) return;
    const step = Math.min(dt, 0.05);
    for (let i = 0; i < count; i++) {
      vel[i].y -= GRAVITY * step;
      pos[i].addScaledVector(vel[i], step);
      if (pos[i].y <= GROUND_Y) respawn(i, false);
      dummy.position.copy(pos[i]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false} visible={false}>
      <sphereGeometry args={[0.07, 6, 4]} />
      <meshStandardMaterial color="#cdb672" roughness={0.7} metalness={0.05} />
    </instancedMesh>
  );
}
