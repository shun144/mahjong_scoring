import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // ARCHITECTURE.md A8: 新設レイヤー(engine/features/shared/app)向けの絶対パスエイリアス。
    // 既存の相対importとは共存させ、一括置換はしない。
    alias: {
      "@/engine": fileURLToPath(new URL("./src/engine", import.meta.url)),
      "@/features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "@/shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@/app": fileURLToPath(new URL("./src/app", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // e2e/ は @playwright/test 用のスペックなのでVitestの対象から除外する
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
