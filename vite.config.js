import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      algorithm: "gzip",
      threshold: 1024,
      minRatio: 0.8,
    }),
  ],
    base: process.env.VITE_BASE_URL || '/',
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.warn", "console.error"],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ["vue", "vue-router"],
          "element-plus": ["element-plus"],
          "element-icons": ["@element-plus/icons-vue"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
