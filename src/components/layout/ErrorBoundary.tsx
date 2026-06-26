import { Component, type ErrorInfo, type ReactNode } from "react";
import "./ErrorBoundary.css";

interface Props {
  children: ReactNode;
  /** 错误卡标题，默认「这块地暂时没法耕作」 */
  title?: string;
  /** 错误卡说明，默认提示三维/计算出错 */
  hint?: string;
}

interface State {
  error: Error | null;
}

/**
 * 田园风错误边界：捕获三维 Canvas、Worker 调度或子树抛出的运行时错误，
 * 展示一张「事故地块」卡片并提供重试（重置内部状态以重新挂载子树）。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 仅控制台留痕，不向用户暴露堆栈
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const title = this.props.title ?? "这块地暂时没法耕作";
    const hint =
      this.props.hint ??
      "三维场景或计算任务出了点状况。可以重试一次，或返回上一个场景继续。";

    return (
      <div className="eb">
        <div className="eb__card card reveal" role="alert" aria-live="assertive">
          <div className="eb__mark" aria-hidden="true">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <path
                d="M28 6 L50 44 L6 44 Z"
                fill="rgba(199, 93, 74, 0.14)"
                stroke="#c75d4a"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path
                d="M28 22 V33"
                stroke="#c75d4a"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <circle cx="28" cy="38.5" r="2.2" fill="#c75d4a" />
            </svg>
          </div>
          <span className="eyebrow">运行异常 · Runtime</span>
          <h2 className="eb__title">{title}</h2>
          <p className="eb__hint">{hint}</p>
          <pre className="eb__msg mono">{error.message || String(error)}</pre>
          <div className="eb__actions">
            <button
              type="button"
              className="btn-primary"
              onClick={this.handleReset}
            >
              重试一次
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                typeof window !== "undefined" && window.location.assign("/")
              }
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }
}