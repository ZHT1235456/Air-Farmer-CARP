import type { SimSnapshot } from "./simulationEngine";

/**
 * 仿真快照外部 store（useSyncExternalStore）。
 * 高频快照只通知订阅者（仪表盘/控制台/已播种航带），
 * 不触发三维 Canvas / 相机控制重渲染，避免干扰拖拽旋转/平移。
 */
let current: SimSnapshot | null = null;
const listeners = new Set<() => void>();

export const simStore = {
  set(snap: SimSnapshot) {
    current = snap;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get(): SimSnapshot | null {
    return current;
  },
};
