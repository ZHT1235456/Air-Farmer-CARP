import type { ThreeEvent } from "@react-three/fiber";
import type { Strip } from "../types/domain";
import { useAppStore } from "../store/appStore";
import { segmentTransform } from "./coords";

const STRIP_Y = 0.09;
const STRIP_W = 1.5;

/** 播种航带：贴地窄条，点击选中高亮 */
export default function StripRenderer({ strips }: { strips: Strip[] }) {
  const selectedId = useAppStore((s) => s.selectedStripId);
  const selectStrip = useAppStore((s) => s.selectStrip);

  return (
    <group>
      {strips.map((strip) => {
        const selected = strip.id === selectedId;
        const color = selected ? "#d9a441" : strip.blockedByObstacle ? "#b5793a" : "#c9a86b";
        const t = segmentTransform(strip.start, strip.end, STRIP_Y);
        return (
          <mesh
            key={strip.id}
            position={t.position}
            rotation={[0, t.rotationY, 0]}
            receiveShadow
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              selectStrip(strip.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <boxGeometry args={[t.length, 0.06, selected ? STRIP_W * 1.5 : STRIP_W]} />
            <meshStandardMaterial
              color={color}
              roughness={0.9}
              metalness={0}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
              emissive={selected ? "#d9a441" : "#000000"}
              emissiveIntensity={selected ? 0.25 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}
