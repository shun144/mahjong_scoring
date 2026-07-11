import postcssGlobalData from "@csstools/postcss-global-data";
import postcssCustomMedia from "postcss-custom-media";

// Vite は各CSSファイルを個別にPostCSS処理するため、@custom-media の定義（breakpoints.css）を
// 全ファイルへ読み込ませるには postcss-global-data が必要（postcss-custom-media の前段に置く）。
export default {
  plugins: [
    postcssGlobalData({
      files: ["src/styles/breakpoints.css"],
    }),
    postcssCustomMedia(),
  ],
};
