import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  // --- ARCHITECTURE.md A6/A7: 依存方向の境界ルール ---
  // 適用範囲は新設レイヤー(engine/features/shared/app)のみ。旧 components/store/content/data/settings
  // 直下は files glob にそもそも含まれないため対象外(T-025で旧ディレクトリ整理後に全域へ拡大する)。
  {
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/shared/*", "@/app/*"],
              message:
                "engine(コア・ドメイン)は features/shared/app のいずれにも依存できません(ARCHITECTURE.md A6)。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/app/*"],
              message: "shared/ は features/app に依存できません(ARCHITECTURE.md A6)。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    ignores: ["src/features/practice/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*"],
              message:
                "featureは他のfeatureを直接importできません。shared/経由にしてください(ARCHITECTURE.md A6)。自feature内の参照は相対importを使うこと。",
            },
          ],
        },
      ],
    },
  },
  {
    // 唯一の明示的な例外(ARCHITECTURE.md A6): practiceはsettingsの切り上げ満貫設定を読むため直接importできる。
    files: ["src/features/practice/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "!@/features/settings", "!@/features/settings/**"],
              message:
                "features/practice は features/settings 以外の他featureを直接importできません(ARCHITECTURE.md A6)。",
            },
          ],
        },
      ],
    },
  },
);
