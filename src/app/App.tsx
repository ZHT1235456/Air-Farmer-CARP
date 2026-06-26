import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense } from "react";
import ErrorBoundary from "../components/layout/ErrorBoundary";
import PageSkeleton from "../components/layout/PageSkeleton";
import ScrollToTop from "../components/layout/ScrollToTop";
import AppLayout from "../components/layout/AppLayout";
import { LandingPage, NAV_ITEMS } from "./routes";

export default function App() {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* 首页：独立导引页，无顶部栏 */}
        <Route path="/" element={<LandingPage />} />

        {/* 其余页面共享顶部栏布局，并按路由分包懒加载 */}
        <Route
          element={
            <ErrorBoundary title="整页出了一点状况">
              <AppLayout />
            </ErrorBoundary>
          }
        >
          {NAV_ITEMS.map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                <ErrorBoundary
                  title="该模块暂时没法展示"
                  hint="页面渲染或后台计算出错。可以重试，或返回上一页继续。"
                >
                  <Suspense key={location.pathname} fallback={<PageSkeleton />}>
                    {item.element}
                  </Suspense>
                </ErrorBoundary>
              }
            />
          ))}
        </Route>
      </Routes>
    </>
  );
}