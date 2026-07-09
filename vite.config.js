import { defineConfig } from "vite";

// Relative base so assets resolve under /horizon/ on GitHub Pages
// whether paths are absolute or the site is opened from a subpath.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  },
});
