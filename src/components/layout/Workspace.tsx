import type { ReactNode } from "react";
import "./Workspace.css";

interface WorkspaceProps {
  /** 左侧控制栏内容 */
  left: ReactNode;
  /** 右侧信息栏内容（省略则不渲染右栏） */
  right?: ReactNode;
  /** 中央三维视口内容 */
  children: ReactNode;
  /** 附加修饰类名（如 workspace--wide-right） */
  className?: string;
}

/** 统一双侧栏工作区：左控制栏 / 中三维视口 / 右信息栏 */
export default function Workspace({ left, right, children, className }: WorkspaceProps) {
  return (
    <div
      className={
        "workspace" + (right ? "" : " workspace--no-right") + (className ? " " + className : "")
      }
    >
      <aside className="workspace__side workspace__side--left">{left}</aside>
      <div className="workspace__stage">
        <div className="workspace__viewport">{children}</div>
      </div>
      {right && <aside className="workspace__side workspace__side--right">{right}</aside>}
    </div>
  );
}

/** 侧栏分组：小标题 + 内容 */
export function SidebarSection({
  title,
  children,
  scroll,
}: {
  title?: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  return (
    <section className={"side-section" + (scroll ? " side-section--scroll" : "")}>
      {title && <span className="side-section__label">{title}</span>}
      {children}
    </section>
  );
}

/** 侧栏头部：eyebrow + 标题 */
export function SidebarHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="side-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="side-header__title">{title}</h1>
    </header>
  );
}
