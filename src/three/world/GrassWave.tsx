import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { SceneBounds } from "../coords";

const COUNT = 160;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

interface Blade {
  x: number;
  z: number;
  h: number;
  phase: number;
}

/** 围绕田外的轻量草秆，随时间正弦摆动（instanced、单 draw call） */
export default function GrassWave({ bounds }: { bounds: SceneBounds }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const blades = useMemo<Blade[]>(() => {
    const rnd = rng(7);
    const cx = bounds.center.x;
    const cz = -bounds.center.y;
    const arr: Blade[] = [];
    for (let i = 0; i < COUNT; i++) {
      const ang = rnd() * Math.PI * 2;
      const r = bounds.size * (0.42 + rnd() * 0.95);
      arr.push({
        x: cx + Math.cos(ang) * r,
        z: cz + Math.sin(ang) * r,
        h: 0.45 + rnd() * 0.55,
        phase: rnd() * Math.PI * 2,
      });
    }
    return arr;
  }, [bounds]);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    blades.forEach((g, i) => {
      dummy.position.set(g.x, g.h / 2, g.z);
      dummy.scale.set(1, g.h, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(i, dummy.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [blades]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < blades.length; i++) {
      const g = blades[i];
      const w = Math.sin(t * 1.6 + g.phase) * 0.14 + Math.sin(t * 0.7 + g.phase) * 0.06;
      dummy.position.set(g.x, g.h / 2, g.z);
      dummy.scale.set(1, g.h, 1);
      dummy.rotation.set(0, 0, w);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} receiveShadow>
      <cylinderGeometry args={[0.018, 0.05, 1, 5]} />
      <meshStandardMaterial color="#6f8a55" roughness={0.95} metalness={0} />
    </instancedMesh>
  );
}