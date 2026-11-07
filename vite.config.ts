import path from "node:path";
import notes from "./src/filaman/release-notes.json";
import upstream from "./upstream-source.json";
import { defineConfig, type PluginOption } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

let builtBase = "/";

const hostedIndexPlugin: PluginOption = {
  name: "hosted-index-shell",
  configResolved(config) {
    builtBase = config.base;
  },
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "filaman-release.json",
      source: JSON.stringify({ version: notes.version, upstream: upstream.commit, base: builtBase }),
    });
  },
  transformIndexHtml(html) {
    return html
      .replace(/\s*<link rel="manifest"[^>]*>\n?/g, "")
      .replace(/\s*<link rel="search"[^>]*>\n?/g, "")
      .replace(/\s*<link rel="canonical"[^>]*>\n?/g, "");
  },
};

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [vue(), tailwindcss(), hostedIndexPlugin],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: process.env.FILAMAN_DEV_URL ? Object.fromEntries(
      ['/api','/auth','/plugins/filament-swatch/hosted-config','/spool-reel.js','/reel-flange.webp','/plugin-fonts.css','/_astro/'].map(prefix=>[prefix,{target:process.env.FILAMAN_DEV_URL,changeOrigin:true}])
    ) : {},
  },
});
