import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { ModeId } from "../modes";
import { MODES } from "../modes";
import { HamburgerButton } from "../../components/HamburgerButton";
import { Sidebar } from "./Sidebar";

interface Props {
  title: string;
  /** このヘッダーが属するモード。自モードのボタンをサイドバーの「他のモードで練習」から除外する。 */
  currentMode: ModeId;
  /** 成績画面の「練習に戻る」が戻ってくるべき出題パス（例: "/quiz"）。 */
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
 * ハンバーガー＋右ドロワーのサイドバーに「ホーム」「他のモードで練習」「成績」を集約したヘッダー。
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
        <HamburgerButton open={open} onClick={() => setOpen(true)} />
      </div>
      <Sidebar open={open} onClose={() => setOpen(false)} label="メニュー">
        <Link to="/" className="sidebar-nav-item" onClick={() => setOpen(false)}>
          <span className="sidebar-nav-icon" aria-hidden="true">
            🏠
          </span>
          ホーム
        </Link>
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
