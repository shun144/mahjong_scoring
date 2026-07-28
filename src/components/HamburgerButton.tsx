interface Props {
  open: boolean;
  onClick: () => void;
}

//TODO:da
export function HamburgerButton({ open, onClick }: Props) {
  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-full border-none bg-none p-0 text-fl-teal-dark transition-colors duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-fl-teal-dark/[0.14]"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "メニューを閉じる" : "メニューを開く"}
    >
      <span className="block h-[3px] w-5 rounded-full bg-current" aria-hidden="true" />
      <span className="block h-[3px] w-5 rounded-full bg-current" aria-hidden="true" />
      <span className="block h-[3px] w-5 rounded-full bg-current" aria-hidden="true" />
    </button>
  );
}
