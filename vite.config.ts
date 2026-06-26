import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri 2 友好：相对资源路径，固定端口，避免浏览器端不可控服务
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: "es2021",
    outDir: "dist",
  },
});
