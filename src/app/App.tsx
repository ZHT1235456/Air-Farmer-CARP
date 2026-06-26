import { Routes, Route } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { LandingPage, NAV_ITEMS } from "./routes";

export default function App() {
  return (
    <Routes>
      {/* 首页：独立导引页，无顶部栏 */}
      <Route path="/" element={<LandingPage />} />

      {/* 其余页面共享顶部栏布局 */}
      <Route element={<AppLayout />}>
        {NAV_ITEMS.map((item) => (
          <Route key={item.path} path={item.path} element={item.element} />
        ))}
      </Route>
    </Routes>
  );
}
