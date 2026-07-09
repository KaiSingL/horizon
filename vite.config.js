import { defineConfig } from "vite";

// Local dev: base "/". GitHub Actions sets VITE_BASE_PATH=/{repo}/ for project Pages.
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  publicDir: "public",
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  },
});
