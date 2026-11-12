
import fs from "node:fs";
import path from "node:path";

const SITE_URL = (
  process.env.SITE_URL || "http://blacksprut-sait.top"
).replace(/\/+$/, "");

const ROOT_DIR = process.env.SITE_DIR || ".";
const OUTPUT_FILE = path.join(ROOT_DIR, "sitemap.xml");

const EXCLUDED_DIRS = new Set([
  ".git",
  ".github",
  ".wrangler",
  "node_modules",
  "functions"
]);

const EXCLUDED_FILES = new Set([
  "404.html",
  "sitemap.xml",
  "generate-sitemap.mjs"
]);

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, char => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  })[char]);
}

function encodePath(value) {
  return value
    .split("/")
    .map(segment => encodeURIComponent(segment))
    .join("/");
}

function scanDirectory(directory, results = []) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      scanDirectory(fullPath, results);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".html")) continue;
    if (EXCLUDED_FILES.has(entry.name.toLowerCase())) continue;

    const html = fs.readFileSync(fullPath, "utf8");

    if (/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*content=["'][^"']*noindex/i.test(html)) {
      continue;
    }

    const relativePath = path.relative(
      ROOT_DIR,
      fullPath
    ).split(path.sep).join("/");

    let urlPath = relativePath;

    if (urlPath === "index.html") {
      urlPath = "";
    } else if (urlPath.endsWith("/index.html")) {
      urlPath = urlPath.slice(0, -"index.html".length);
    }

    const url = SITE_URL + "/" + encodePath(urlPath);

    const lastmod = fs.statSync(fullPath)
      .mtime.toISOString().split("T")[0];

    results.push({ url, lastmod });
  }

  return results;
}

const pages = scanDirectory(ROOT_DIR);

pages.sort((a, b) => a.url.localeCompare(b.url));

const urls = pages.map(page => `
  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`).join("");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(OUTPUT_FILE, sitemap, "utf8");

console.log("================================");
console.log(" SITEMAP GENERATED SUCCESSFULLY");
console.log("================================");
console.log("Domain :", SITE_URL);
console.log("Pages  :", pages.length);
console.log("Output :", OUTPUT_FILE);
