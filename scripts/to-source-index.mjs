import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
let out = html
  .replace(/<script type="module"[^>]*src="\.\/assets\/[^"]*"><\/script>\s*/g, "")
  .replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/[^"]*">\s*/g, "")
  .replace(/href="\.\/assets\/favicon[^"]*"/g, 'href="/favicon.svg"')
  .replace(/href="\.\/favicon\.svg"/g, 'href="/favicon.svg"');

if (!out.includes('src="/src/main.js"') && !out.includes("src='/src/main.js'")) {
  out = out.replace(
    "</body>",
    '    <script type="module" src="/src/main.js"></script>\n  </body>'
  );
}

fs.writeFileSync("index.html", out);
console.log("Restored source entry:", out.includes("/src/main.js"));
