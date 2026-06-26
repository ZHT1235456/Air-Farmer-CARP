import { useMemo } from "react";
import * as THREE from "three";
import type { Field } from "../../types/domain";
import { soilDetailTexture, soilBumpTexture } from "./procTextures";

const REPEAT = 1 / 6; // 每 6 世界单位平铺一次

function hash01(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

/** 单片农田写实土壤面：犁沟方向随 stripDirection，纹理偏移随田块区分 */
export default function FieldGround({ field }: { field: Field }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    field.polygon.forEach((p, i) => (i === 0 ? s.moveTo(p.x, p.y) : s.lineTo(p.x, p.y)));
    s.closePath();
    return s;
  }, [field.polygon]);

  const { map, bump } = useMemo(() => {
    const rot = -(field.stripDirection - Math.PI / 2); // 犁沟对齐航带方向
    const m = soilDetailTexture(REPEAT, rot);
    const b = soilBumpTexture(REPEAT, rot);
    const off = hash01(field.id);
    m.offset.set(off, off * 0.7);
    b.offset.set(off, off * 0.7);
    return { map: m, bump: b };
  }, [field.stripDirection, field.id]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        map={map}
        bumpMap={bump}
        bumpScale={0.4}
        roughness={0.97}
        metalness={0}
      />
    </mesh>
  );
}
