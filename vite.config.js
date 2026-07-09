import { defineConfig } from "vite";

// GitHub Pages project sites live at https://user.github.io/<repo>/
// The workflow sets VITE_BASE_PATH=/${{ github.event.repository.name }}/
// Locally and for user/org root sites, base stays "/".
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
