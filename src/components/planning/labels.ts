import type { AlgorithmMode } from "../../types/domain";

export const MODE_LABELS: Record<AlgorithmMode, string> = {
  pathScanning: "快速 · Path Scanning",
  genetic: "标准 · 遗传算法",
  memetic: "高质量 · MemeticGA",
  vns: "局部改进 · VNS",
  compare: "对比模式",
};

export const MODE_SHORT: Record<AlgorithmMode, string> = {
  pathScanning: "Path Scanning",
  genetic: "GA",
  memetic: "MemeticGA",
  vns: "VNS",
  compare: "对比",
};

/** 收敛曲线 / 对比表配色（与三维分趟色无关，按算法区分） */
export const ALGO_COLORS: Record<AlgorithmMode, string> = {
  pathScanning: "#3b82f6",
  genetic: "#10b981",
  memetic: "#d9a441",
  vns: "#ec4899",
  compare: "#8b5cf6",
};
