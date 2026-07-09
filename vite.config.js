import { defineConfig } from "vite";

/**
 * Force the Vite entry to always be /src/main.js.
 *
 * GitHub Pages needs a production index.html (./assets/*.js) on master.
 * If that file is also used as the Vite input, `vite build` re-bundles the
 * *previous* asset instead of source — Pages stays stale forever.
 *
 * This plugin rewrites any production script/link tags back to the source
 * entry before Vite resolves the graph (dev + build).
 */
function forceSourceEntry() {
  return {
    name: "force-source-entry",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        let out = html;
        // Drop production bundles if present
        out = out.replace(
          /<script type="module"[^>]*src="\.\/assets\/[^"]*"><\/script>\s*/g,
          ""
        );
        out = out.replace(
          /<link rel="stylesheet"[^>]*href="\.\/assets\/[^"]*">\s*/g,
          ""
        );
        // Normalize favicon to public file
        out = out.replace(
          /href="\.\/assets\/favicon[^"]*"/g,
          'href="/favicon.svg"'
        );
        out = out.replace(/href="\.\/favicon\.svg"/g, 'href="/favicon.svg"');
        // Ensure source entry exists once
        if (!out.includes('src="/src/main.js"') && !out.includes("src='/src/main.js'")) {
          out = out.replace(
            "</body>",
            '    <script type="module" src="/src/main.js"></script>\n  </body>'
          );
        }
        return out;
      },
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: "public",
  plugins: [forceSourceEntry()],
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  },
});
