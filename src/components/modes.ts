export type ModeId = "score" | "fu" | "fu-parts" | "convert";

export interface ModeDef {
  id: ModeId;
  label: string;
  path: string;
  icon: string;
}

// 4つの練習モードの共有定義（id・表示ラベル・遷移先パス・アイコン）。
// HomePage のモード選択カードとサイドバーのモード切替ボタンの両方から参照し、二重管理を避ける。
export const MODES: ModeDef[] = [
  { id: "score", label: "点数計算モード", path: "/quiz", icon: "🧮" },
  { id: "fu", label: "符計算モード", path: "/fu/quiz", icon: "🔢" },
  { id: "fu-parts", label: "符分解モード", path: "/fu/parts", icon: "🧩" },
  { id: "convert", label: "点数換算モード", path: "/convert", icon: "📐" },
];
