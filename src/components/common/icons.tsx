/**
 * 田园风自绘 SVG 图标集：取代 Unicode 字符，统一 16×16 stroke 风格。
 * 全站 Feature / Capability / 仿真控制台 / 导览控制台共用。
 */
import type { ReactNode } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 16, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export type IconName =
  | "smart"
  | "drone"
  | "lowalt"
  | "obstacle"
  | "refill"
  | "scene"
  | "strips"
  | "planning"
  | "simulate"
  | "compare"
  | "play"
  | "pause"
  | "reset"
  | "slower"
  | "faster"
  | "back";

const PATHS: Record<IconName, ReactNode> = {
  smart: (
    <>
      <path d="M4 18 L4 12 L8 6 L12 12 L12 18 Z" />
      <path d="M12 18 L12 14 L16 9 L20 14 L20 18" />
      <path d="M2 18 L22 18" />
    </>
  ),
  drone: (
    <>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M6 6 L12 12 L18 6 M6 18 L12 12 L18 18" />
      <path d="M11 14 a3 3 0 0 0 2 0 l0.5 3 l-3 0 z" />
    </>
  ),
  lowalt: (
    <>
      <path d="M3 20 L21 20" />
      <path d="M3 13 L12 7 L21 13" />
      <path d="M7 13 L7 20 M12 13 L12 20 M17 13 L17 20" />
    </>
  ),
  obstacle: (
    <>
      <path d="M11 21 L11 7" />
      <path d="M11 7 L7 4 M11 7 L15 4" />
      <circle cx="11" cy="9" r="3.4" opacity="0.4" />
    </>
  ),
  refill: (
    <>
      <path d="M7 10 L13 10 L13 20 L7 20 Z" />
      <path d="M7 13 L13 13" />
      <path d="M16 6 a3 3 0 0 1 0 6 l-3 0" />
      <path d="M10 3 l0 4" />
    </>
  ),
  scene: (
    <>
      <path d="M4 16 L4 8 L10 5 L20 9 L20 16 Z" />
      <path d="M4 12 L20 12" />
    </>
  ),
  strips: (
    <>
      <path d="M4 4 L20 4 M4 9 L20 9 M4 14 L20 14 M4 19 L20 19" />
    </>
  ),
  planning: (
    <>
      <path d="M4 6 L9 6 L9 12 L4 12 Z" />
      <path d="M14 11 L20 11 L20 18 L14 18 Z" />
      <path d="M9 9 L14 14" />
    </>
  ),
  simulate: (
    <>
      <path d="M12 3 L12 8" />
      <path d="M12 8 a2.8 2.8 0 0 0 3 3" opacity="0.8" />
      <circle cx="12" cy="15" r="5" />
      <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  compare: (
    <>
      <path d="M5 4 L5 20" />
      <path d="M19 4 L19 20" />
      <path d="M5 8 L12 8 L12 16 L19 16" />
    </>
  ),
  play: <path d="M8 5 L18 12 L8 19 Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  reset: (
    <>
      <path d="M19 12 a7 7 0 1 1 -2.5 -5.3" />
      <path d="M19 4 L19 9 L14 9" />
    </>
  ),
  slower: (
    <>
      <path d="M4 12 a8 8 0 0 1 8 -8" />
      <path d="M11 8 L12 4 L7 4" />
      <path d="M4 20 L20 20" />
    </>
  ),
  faster: (
    <>
      <path d="M20 12 a8 8 0 0 0 -8 -8" />
      <path d="M13 8 L12 4 L17 4" />
      <path d="M4 20 L20 20" />
    </>
  ),
  back: (
    <>
      <path d="M11 5 L5 12 L11 19" />
      <path d="M5 12 L20 12" />
    </>
  ),
};

export function Icon({ name, size = 16, className }: { name: IconName } & IconProps) {
  return (
    <Svg size={size} className={className}>
      {PATHS[name]}
    </Svg>
  );
}