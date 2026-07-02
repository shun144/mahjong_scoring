import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages のプロジェクトページ配下（/mahjong_scoring/）で配信するため base を指定
  base: "/mahjong_scoring/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // e2e/ は @playwright/test 用のスペックなのでVitestの対象から除外する
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
