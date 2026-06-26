import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import { useCurrentScenario } from "../../store/appStore";

export default function AppLayout() {
  const scenario = useCurrentScenario();
  return (
    <>
      <TopBar status={`当前场景 · ${scenario.name}`} />
      <main style={{ minHeight: "calc(100vh - var(--topbar-h))" }}>
        <Outlet />
      </main>
    </>
  );
}
