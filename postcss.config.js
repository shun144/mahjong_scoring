import tailwindcss from "@tailwindcss/postcss";
import postcssGlobalData from "@csstools/postcss-global-data";
import postcssCustomMedia from "postcss-custom-media";

// Vite は各CSSファイルを個別にPostCSS処理するため、@custom-media の定義（breakpoints.css）を
// 全ファイルへ読み込ませるには postcss-global-data が必要（postcss-custom-media の前段に置く）。
// tailwindcss（@theme/@import "tailwindcss/..." の展開・ユーティリティ生成）は、
// @media (--bp-xxx) のカスタムメディア展開が先に済んでいる必要があるため postcss-custom-media
// の後段に置く（先に置くと未展開の --bp-xxx を検証してエラーになる）。
export default {
  plugins: [
    postcssGlobalData({
      files: ["src/styles/breakpoints.css"],
    }),
    postcssCustomMedia(),
    tailwindcss(),
  ],
};
