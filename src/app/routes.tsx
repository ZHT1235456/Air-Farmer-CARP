import type { ReactNode } from "react";
import LandingPage from "../pages/LandingPage";
import ScenePreviewPage from "../pages/ScenePreviewPage";
import RoutePlanningPage from "../pages/RoutePlanningPage";
import SimulationPage from "../pages/SimulationPage";
import GuidePage from "../pages/GuidePage";

export interface NavItem {
  path: string;
  label: string;
  element: ReactNode;
}

/** 顶部栏导航项（首页独立，不在此列表） */
export const NAV_ITEMS: NavItem[] = [
  { path: "/scene", label: "场景预览", element: <ScenePreviewPage /> },
  { path: "/planning", label: "航线规划", element: <RoutePlanningPage /> },
  { path: "/simulation", label: "播种模拟", element: <SimulationPage /> },
  { path: "/guide", label: "操作说明", element: <GuidePage /> },
];

export { LandingPage };
