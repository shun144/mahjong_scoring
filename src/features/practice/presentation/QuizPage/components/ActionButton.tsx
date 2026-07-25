interface Props {
  label: string;
  icon: string;
  onClick: () => void;
}

/** 「もう一度」「次の問題へ」で共有するピル型アクションボタン。 */
function ActionButton({ label, icon, onClick }: Props) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 min-h-[48px] px-6 text-[0.95rem] font-bold text-fl-teal-dark bg-fl-cream border-2 border-fl-teal rounded-[var(--fl-r-pill)] cursor-pointer transition-[transform,background,color,box-shadow] duration-[220ms] ease-[var(--fl-bounce)] hover:text-fl-cream hover:bg-fl-teal hover:shadow-[var(--fl-glow-teal)] hover:-translate-y-0.5 active:scale-[0.96] motion-reduce:transition-none motion-reduce:transform-none"
      onClick={onClick}
    >
      {label}
      <span className="text-[1.05em] leading-none" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

export { ActionButton };
