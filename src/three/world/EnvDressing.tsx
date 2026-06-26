import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Point2D } from "../../types/domain";
import type { SceneBounds } from "../coords";
import { cloudTexture } from "./procTextures";

interface TreeInstance {
  x: number;
  z: number;
  height: number;
  trunkR: number;
  crown: number;
  color: THREE.Color;
}

const TREE_COUNT = 18;

/** 环境点缀：远景树（InstancedMesh）+ 几片云 */
export default function EnvDressing({
  bounds,
  depot,
}: {
  bounds: SceneBounds;
  depot: Point2D;
}) {
  const trees = useMemo<TreeInstance[]>(() => {
    const out: TreeInstance[] = [];
    const cx = bounds.center.x;
    const cy = bounds.center.y;
    const rMin = bounds.size * 0.75;
    const rMax = bounds.size * 1.5;
    let seed = 1234;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < TREE_COUNT; i++) {
      const ang = (i / TREE_COUNT) * Math.PI * 2 + rnd() * 0.5;
      const r = rMin + rnd() * (rMax - rMin);
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      if (Math.hypot(x - depot.x, y - depot.y) < 12) continue;
      const hue = 95 + (rnd() - 0.5) * 60;
      out.push({
        x,
        z: -y,
        height: 4 + rnd() * 3,
        trunkR: 0.7 + rnd() * 0.4,
        crown: 2.4 + rnd() * 1.6,
        color: new THREE.Color().setHSL(hue / 360, 0.42, 0.26 + rnd() * 0.12),
      });
    }
    return out;
  }, [bounds, depot]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    trees.forEach((t, i) => {
      dummy.position.set(t.x, t.height / 2, t.z);
      dummy.scale.set(t.trunkR, t.height, t.trunkR);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, t.height + t.crown * 0.4, t.z);
      dummy.scale.set(t.crown, t.crown, t.crown);
      dummy.updateMatrix();
      crownRef.current?.setMatrixAt(i, dummy.matrix);
      crownRef.current?.setColorAt(i, t.color);
    });
    if (trunkRef.current) trunkRef.current.instanceMatrix.needsUpdate = true;
    if (crownRef.current) {
      crownRef.current.instanceMatrix.needsUpdate = true;
      if (crownRef.current.instanceColor) crownRef.current.instanceColor.needsUpdate = true;
    }
  }, [trees]);

  const clouds = useMemo(() => {
    const tex = cloudTexture();
    const arr: { pos: [number, number, number]; scale: number }[] = [];
    let seed = 99;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 6; i++) {
      arr.push({
        pos: [
          bounds.center.x + (rnd() - 0.5) * bounds.size * 2.4,
          bounds.size * 0.7 + rnd() * bounds.size * 0.4,
          -bounds.center.y + (rnd() - 0.5) * bounds.size * 2.4,
        ],
        scale: bounds.size * (0.4 + rnd() * 0.35),
      });
    }
    return { tex, arr };
  }, [bounds]);

  const count = trees.length;
  if (count === 0) return null;

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 1, 8]} />
        <meshStandardMaterial color="#5a4326" roughness={0.95} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[undefined, undefined, count]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial flatShading roughness={0.9} metalness={0} />
      </instancedMesh>

      {clouds.arr.map((c, i) => (
        <sprite key={i} position={c.pos} scale={[c.scale, c.scale * 0.55, 1]}>
          <spriteMaterial map={clouds.tex} transparent opacity={0.78} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
}
