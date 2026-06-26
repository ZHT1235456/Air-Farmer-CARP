import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 路由切换时把窗口滚动位置重置到顶部。
 * 挂载在 <App> 内、<Routes> 之外，靠监听 pathname 变化触发。
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 用 instant 行为避免和路由过渡动画打架
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}