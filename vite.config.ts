import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      // devOptions: {
      //   enabled: true,
      //   type: "module",
      //   navigateFallback: "index.html",
      // },
      manifest: {
        name: "TreeScii - ASCII Tree Generator",
        short_name: "TreeScii",
        description:
          "Interactive ASCII folder structure diagram generator with powerful editing features and multiple project templatesTreeScii is a powerful ASCII tree generator that lets you create and share beautiful hierarchical structures with ease. | TreeScii 是一个强大的 ASCII 树生成器，让你轻松创建和分享漂亮的层次结构。",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        id: "/",
        dir: "ltr",
        icons: [
          {
            src: "treescii.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "preview.png",
            sizes: "1280x720",
            type: "image/png",
            label: "TreeScii editor interface",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
