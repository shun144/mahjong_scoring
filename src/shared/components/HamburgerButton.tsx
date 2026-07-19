interface Props {
  open: boolean;
  onClick: () => void;
}

/** サイドバーを開閉するハンバーガーボタン（点数計算モードのヘッダー用・再利用可能）。 */
export function HamburgerButton({ open, onClick }: Props) {
  return (
    <button
      type="button"
      className="hamburger-btn"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "メニューを閉じる" : "メニューを開く"}
    >
      <span className="hamburger-btn-bar" aria-hidden="true" />
      <span className="hamburger-btn-bar" aria-hidden="true" />
      <span className="hamburger-btn-bar" aria-hidden="true" />
    </button>
  );
}
