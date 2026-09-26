import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { ModeId } from "./modes";
import { MODES } from "./modes";
import { HamburgerButton } from "./HamburgerButton";
import { Sidebar } from "./Sidebar";

interface Props {
  title: string;
  currentMode: ModeId;
  backTo?: string;
  /**
   * 現在表示中の問題。渡しておくと成績画面から同じ問題（同じ4択・並び順）に戻れる。
   * shared/はfeatures/practiceのProblem型に依存できないため、ここでは中身を見ない
   * opaqueな値として扱う（ARCHITECTURE.md A6）。
   */
  problem?: unknown;
  /** 「成績」リンクを表示するか（既定 true）。成績に連携しないモード（符分解・点数換算）は false を渡す。 */
  showStats?: boolean;
  /** ハンバーガーの左に置く追加のアイコンボタン等（例: 点数計算モードの点数早見表ボタン）。 */
  headerAction?: ReactNode;
}

/**
 * ホームアイコン＋ハンバーガー（右ドロワーに「他のモードで練習」「成績」を集約）のヘッダー。
 * 点数計算モード系の画面で使う（/quiz・/result・/fu/quiz・/fu/result・/fu/parts・/convert）。
 */
export function SidebarPageHeader({
  title,
  currentMode,
  backTo,
  problem,
  showStats = true,
  headerAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const otherModes = MODES.filter((m) => m.id !== currentMode);

  return (
    <div className="page-header">
      <h1>{title}</h1>
      <div className="page-header-actions">
        {headerAction}
        <Link
          to="/"
          className="inline-flex items-center justify-center w-10 h-10 p-0 text-[1.2rem] leading-none rounded-full bg-transparent text-fl-teal-dark cursor-pointer shrink-0 transition-[background] duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-[rgba(43,168,162,0.14)]"
          aria-label="ホームに戻る"
        >
          <span aria-hidden="true">🏠</span>
        </Link>
        <HamburgerButton open={open} onClick={() => setOpen(true)} />
      </div>
      <Sidebar open={open} onClose={() => setOpen(false)} label="メニュー">
        <p className="sidebar-nav-heading">他のモードで練習</p>
        {otherModes.map((mode) => (
          <Link
            key={mode.id}
            to={mode.path}
            className="sidebar-nav-item"
            onClick={() => setOpen(false)}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              {mode.icon}
            </span>
            {mode.label}
          </Link>
        ))}
        {showStats ? (
          <Link
            to="/stats"
            state={backTo ? { backTo, problem } : undefined}
            className="sidebar-nav-item"
            onClick={() => setOpen(false)}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              📊
            </span>
            成績
          </Link>
        ) : null}
      </Sidebar>
    </div>
  );
}
