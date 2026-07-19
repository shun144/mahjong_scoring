import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./sidebar.css";

interface Props {
  open: boolean;
  onClose: () => void;
  /** サイドバー（role="dialog"）の aria-label。 */
  label: string;
  children: ReactNode;
}

/** 右からスライドインする汎用ドロワー（再利用可能な共通部品）。開いている間のみDOMに存在する。 */
export function Sidebar({ open, onClose, label, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // document.body へ portal する。呼び出し元ヘッダー（帯）が backdrop-filter を持つため、
  // ここに直接描画すると position:fixed の包含ブロックがビューポートではなくヘッダーに
  // なってしまい（CSSの仕様上の挙動）、全面オーバーレイ・右ドロワーが潰れる。
  return createPortal(
    <div className="sidebar-root">
      {/* 背景は装飾扱い（aria-hidden・非フォーカス）。閉じる操作としてはタップのみを受け、
          スクリーンリーダー・キーボード操作は×ボタン／ESCに委ねる。 */}
      <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      <div className="sidebar-panel" role="dialog" aria-modal="true" aria-label={label} ref={panelRef}>
        <div className="sidebar-panel-header">
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <nav className="sidebar-nav">{children}</nav>
      </div>
    </div>,
    document.body,
  );
}
