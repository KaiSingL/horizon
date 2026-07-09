import { defineConfig } from "vite";

/**
 * Production index.html (committed for GitHub Pages on master) references
 * hashed ./assets/* bundles. During `vite dev`, rewrite those tags back to
 * the source entry so HMR still works.
 */
function pagesDevEntry() {
  return {
    name: "pages-dev-entry",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!ctx.server) return html;
        return html
          .replace(
            /<script type="module"[^>]*src="\.\/assets\/[^"]*"><\/script>\s*/g,
            '<script type="module" src="/src/main.js"><\/script>\n'
          )
          .replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/[^"]*">\s*/g, "");
      },
    },
  };
}

export default defineConfig({
  // Relative paths so GitHub Pages project sites work without absolute /repo/ base
  base: "./",
  plugins: [pagesDevEntry()],
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  },
});
