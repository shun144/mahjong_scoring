import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 描画中の予期しないエラーを捕捉し、白画面の代わりに復帰導線を示す。
 * ReactのError BoundaryはクラスコンポーネントでのみsupportedのためClassで実装する。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ error: null });
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="page-shell">
          <h1>問題が発生しました</h1>
          <p>予期しないエラーが発生しました。お手数ですが、最初からやり直してください。</p>
          <button type="button" className="btn-primary" onClick={this.handleReload}>
            ホーム
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
