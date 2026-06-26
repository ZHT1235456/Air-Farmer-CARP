import type { ThreeEvent } from "@react-three/fiber";
import type { Strip } from "../types/domain";
import { useAppStore } from "../store/appStore";
import { segmentTransform } from "./coords";

const STRIP_Y = 0.09;
const STRIP_W = 1.5;

interface StripRendererProps {
  strips: Strip[];
  /** 已播种航带 id 集合（渲翠绿） */
  seededIds?: Set<string>;
  /** 是否允许点击选中（仿真页关闭） */
  interactive?: boolean;
}

/** 播种航带：贴地窄条；点击选中高亮；已播种渲翠绿 */
export default function StripRenderer({
  strips,
  seededIds,
  interactive = true,
}: StripRendererProps) {
  const selectedId = useAppStore((s) => s.selectedStripId);
  const selectStrip = useAppStore((s) => s.selectStrip);

  return (
    <group>
      {strips.map((strip) => {
        const selected = interactive && strip.id === selectedId;
        const seeded = seededIds?.has(strip.id);
        const color = seeded
          ? "#5b9d3e"
          : selected
            ? "#d9a441"
            : strip.blockedByObstacle
              ? "#b5793a"
              : "#c9a86b";
        const t = segmentTransform(strip.start, strip.end, STRIP_Y);
        const handlers = interactive
          ? {
              onClick: (e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                selectStrip(strip.id);
              },
              onPointerOver: (e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              },
              onPointerOut: () => {
                document.body.style.cursor = "auto";
              },
            }
          : {};
        return (
          <mesh
            key={strip.id}
            position={t.position}
            rotation={[0, t.rotationY, 0]}
            receiveShadow
            {...handlers}
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
