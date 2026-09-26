import { Link } from "react-router-dom";
import { useSettings } from "./SettingsContext";
import "./settings.css";

const TOGGLE_CLASS =
  "appearance-none flex-none w-[60px] h-[34px] m-0 rounded-[var(--fl-r-pill)] border-2 border-[rgba(43,168,162,0.35)] bg-fl-cream bg-no-repeat [background-image:radial-gradient(circle,#fff_44%,rgba(0,0,0,0)_46%)] [background-position:left_3px_center] bg-[length:26px_26px] shadow-[inset_0_1px_3px_rgba(18,63,60,0.12)] cursor-pointer transition-[background-color,background-position,border-color,box-shadow] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] checked:border-fl-teal checked:bg-fl-teal checked:[background-position:right_3px_center] checked:shadow-[var(--fl-glow-teal-soft)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-fl-teal)_30%,transparent)] motion-reduce:transition-none";

const ROUND_UP_EXAMPLES = [
  { label: "子・ロン", before: "7700点", after: "8000点" },
  { label: "親・ロン", before: "11600点", after: "12000点" },
  { label: "子・ツモ", before: "2000-3900点", after: "2000-4000点" },
  { label: "親・ツモ", before: "3900点オール", after: "4000点オール" },
] as const;

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();

  return (
    <main className="page-shell settings-page">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 mx-[calc(50%-50vw)] mt-[calc(-1*var(--space-4))] sm:mt-[calc(-1*var(--space-6))] px-[max(16px,calc(50vw-320px))] py-[10px] bg-[rgba(255,248,231,0.86)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] border-b-2 border-[rgba(43,168,162,0.22)]">
        <h1 className="text-[1.15rem] font-extrabold tracking-[0.04em] text-fl-teal-dark">設定</h1>
        <div className="flex gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-10 h-10 p-0 text-[1.2rem] leading-none rounded-full bg-transparent text-fl-teal-dark cursor-pointer shrink-0 transition-[background] duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-[rgba(43,168,162,0.14)]"
            aria-label="ホームに戻る"
          >
            <span aria-hidden="true">🏠</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-fl-muted font-semibold">読み込み中…</p>
      ) : (
        <section
          className="flex flex-col gap-2 py-[18px] px-5 bg-fl-card border-2 border-[rgba(43,168,162,0.3)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] animate-[settings-rise_420ms_var(--fl-bounce)_both] motion-reduce:animate-none"
          aria-label="切り上げ満貫"
        >
          <label
            className="flex items-center justify-between gap-4 cursor-pointer"
            htmlFor="round-up-mangan"
          >
            <span className="flex flex-col gap-1">
              <span className="text-[1.05rem] font-extrabold text-fl-ink">切り上げ満貫</span>
              <span className="text-[0.85rem] leading-[1.6] text-fl-muted">
                満貫にわずかに届かない点数を、満貫の点数まで繰り上げます。
              </span>
            </span>
            <input
              id="round-up-mangan"
              type="checkbox"
              role="switch"
              className={TOGGLE_CLASS}
              checked={settings.roundUpMangan}
              onChange={(e) => updateSettings({ roundUpMangan: e.target.checked })}
            />
          </label>

          <ul
            className={`list-none m-0 p-0 mt-1 flex flex-col gap-0 border-t-2 border-[rgba(43,168,162,0.22)] [border-top-style:dashed] transition-opacity duration-[var(--fl-dur)] ease-[var(--fl-bounce)] motion-reduce:transition-none ${
              settings.roundUpMangan ? "opacity-100" : "opacity-55"
            }`}
          >
            {ROUND_UP_EXAMPLES.map(({ label, before, after }) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 py-2 border-b-2 border-[rgba(43,168,162,0.22)] [border-bottom-style:dashed] last:border-b-0"
              >
                <span className="text-[0.8rem] font-bold text-fl-body">{label}</span>
                <span className="font-numeric tabular-nums text-[0.85rem] text-fl-muted whitespace-nowrap">
                  {before}
                  <span className="mx-1.5 text-fl-teal" aria-hidden="true">
                    →
                  </span>
                  <span className="font-extrabold text-fl-teal-dark">{after}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
