import { useState } from "react";
import { Link } from "react-router-dom";
import type { Problem } from "../data/problem";
import { HamburgerButton } from "./HamburgerButton";
import { Sidebar } from "./Sidebar";

interface Props {
  title: string;
  /** 成績画面の「練習に戻る」が戻ってくるべき出題パス（例: "/quiz"）。 */
  backTo?: string;
  /** 現在表示中の問題。渡しておくと成績画面から同じ問題（同じ4択・並び順）に戻れる。 */
  problem?: Problem;
  /** 「成績」リンクを表示するか（既定 true）。成績に連携しないモード（符分解・点数換算）は false を渡す。 */
  showStats?: boolean;
}

/**
 * ハンバーガー＋右ドロワーのサイドバーに「ホーム」「成績」を集約したヘッダー。
 * 点数計算モード系の画面で使う（/quiz・/result・/fu/quiz・/fu/result・/fu/parts・/convert）。
 */
export function SidebarPageHeader({ title, backTo, problem, showStats = true }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="page-header">
      <h1>{title}</h1>
      <HamburgerButton open={open} onClick={() => setOpen(true)} />
      <Sidebar open={open} onClose={() => setOpen(false)} label="メニュー">
        <Link to="/" className="sidebar-nav-item" onClick={() => setOpen(false)}>
          <span className="sidebar-nav-icon" aria-hidden="true">
            🏠
          </span>
          ホーム
        </Link>
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
