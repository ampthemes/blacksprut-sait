
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SITE_URL = (process.env.SITE_URL || "").replace(/\/+$/, "");

if (!SITE_URL) {
  throw new Error("SITE_URL belum diatur!");
}

// Bersihkan folder hasil build
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// Salin semua file website ke dist
fs.cpSync(ROOT, DIST, {
  recursive: true,
  preserveTimestamps: true,
  filter(source) {
    const relative = path.relative(ROOT, source);
    if (!relative) return true;

    const first = relative.split(path.sep)[0];

    return ![
      ".git",
      "node_modules",
      ".wrangler",
      "dist",
      "functions"
    ].includes(first);
  }
});

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, c => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  })[c]);
}

function scan(dir, results = []) {
  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    const file = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scan(file, results);
      continue;
    }

    if (!entry.isFile() || !/\.html$/i.test(entry.name)) continue;
    if (entry.name.toLowerCase() === "404.html") continue;

    const html = fs.readFileSync(file, "utf8");
    const metas = html.match(/<meta\b[^>]*>/gi) || [];

    const noindex = metas.some(tag =>
      /\bname=["'](?:robots|googlebot)["']/i.test(tag) &&
      /\bcontent=["'][^"']*\bnoindex\b/i.test(tag)
    );

    if (noindex) continue;

    const relative = path.relative(DIST, file)
      .split(path.sep).join("/");

    let urlPath = relative;

    if (urlPath === "index.html") {
      urlPath = "";
    } else if (urlPath.endsWith("/index.html")) {
      urlPath = urlPath.slice(0, -"index.html".length);
    }

    const loc = SITE_URL + "/" +
      urlPath.split("/").map(encodeURIComponent).join("/");

    const lastmod = fs.statSync(file)
      .mtime.toISOString().slice(0, 10);

    results.push({ loc, lastmod });
  }

  return results;
}

const pages = scan(DIST);
pages.sort((a, b) => a.loc.localeCompare(b.loc));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${escapeXml(page.loc)}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`).join("\n")}
</urlset>`;

fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);

console.log("SITEMAP BERHASIL DIBUAT");
console.log("Domain:", SITE_URL);
console.log("Total URL:", pages.length);
console.log("Output: dist/sitemap.xml");
