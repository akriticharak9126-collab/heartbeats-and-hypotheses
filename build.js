
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const root = process.cwd();
const articlesDir = path.join(root, "articles");
const homepagePath = path.join(root, "index.html");

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
function escapeXML(value = "") {
  return String(value).replace(/[<>&'"]/g, char => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  })[char]);
}

if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
  console.log("Created empty articles folder.");
}

const files = fs.readdirSync(articlesDir)
  .filter(file => file.endsWith(".md"));

const articles = files.map(file => {
  const raw = fs.readFileSync(path.join(articlesDir, file), "utf8");
  const parsed = matter(raw);
  const data = parsed.data;
  const slug = path.basename(file, ".md");
  const body = data.body || parsed.content;

  return { ...data, slug, body };
}).sort((a, b) =>
  new Date(b.date || 0) - new Date(a.date || 0)
);


const cards = articles.map(article => `
  <article class="journal-card">
    ${article.image ? `
      <img
        src="${escapeHTML(article.image)}"
        alt="${escapeHTML(article.title || "Article cover")}"
        loading="lazy"
      >
    ` : ""}
    <p>${escapeHTML(article.author || "Akriti Charak")}</p>
    <h3>${escapeHTML(article.title || article.slug)}</h3>
    <p>${escapeHTML(article.description || article.subtitle || "")}</p>
    <a href="/articles/${encodeURIComponent(article.slug)}/">
      Read the article →
    </a>
  </article>
`).join("\n");


let homepage = fs.readFileSync(homepagePath, "utf8");

homepage = homepage.replace(
  /(<div id="article-list">)[\s\S]*?(<\/div>)/,
  `$1${cards || "<p>New stories are on their way. Stay curious.</p>"}$2`
);

fs.writeFileSync(homepagePath, homepage);

for (const article of articles) {
  const pageDir = path.join(articlesDir, article.slug);
  fs.mkdirSync(pageDir, { recursive: true });

  const title = escapeHTML(article.title || article.slug);
  const description = escapeHTML(article.description || "");
  const image = article.image
    ? `<img src="../../${escapeHTML(article.image)}" alt="${title}" style="max-width:100%;border-radius:12px;">`
    : "";

  
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <title>${title} | Heartbeats & Hypotheses</title>
  <link rel="stylesheet" href="../../style.css">
</head>
<body class="article-page">

  <header class="article-site-header">
    <a href="/" class="article-brand">
      Heartbeats <span>&</span> Hypotheses
    </a>
    <p>Where science meets the human experience.</p>
    <nav>
      <a href="/">Home</a>
      <a href="/#journal">Journal</a>
      <a href="/#about">About Me</a>
    </nav>
  </header>

  <main class="article-container">

    <a href="/#journal" class="article-back">
      ← Back to the journal
    </a>

    <header class="article-heading">
      <p class="article-kicker">HEARTBEATS & HYPOTHESES · JOURNAL</p>

      <h1>${title}</h1>

      ${description ? "<p class=\"article-subtitle\">" + description + "</p>" : ""}
      <div class="article-meta">
        <span>By ${escapeHTML(article.author || "Akriti Charak")}</span>
        ${article.date ? "<span>" + escapeHTML(article.date) + "</span>" : ""}
      </div>
    </header>

    ${image ? `<div class="article-cover">${image}</div>` : ""}

    <article class="article-body">
      ${marked.parse(article.body || "")}
    </article>

    <footer class="article-ending">
      <span>—</span>
      <p>Thank you for being curious.</p>
      <a href="/#journal">Explore more stories →</a>
    </footer>

  </main>

  <footer class="article-footer">
    <p>Heartbeats & Hypotheses</p>
    <span>Where science meets the human experience.</span>
  </footer>

</body>
</html>`;


  fs.writeFileSync(path.join(pageDir, "index.html"), html);
}
// Generate XML sitemap
const siteUrl = "https://heartbeats-and-hypotheses-trfy.vercel.app";

const sitemapUrls = [
  `${siteUrl}/`,
  ...articles.map(article =>
    `${siteUrl}/articles/${encodeURIComponent(article.slug)}/`
  )
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `<url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

fs.writeFileSync(
  path.join(root, "sitemap.xml"),
  sitemap,
  "utf8"
);

console.log("Sitemap generated successfully!");
// Generate RSS feed for newsletter automation

const rssItems = articles.map(article => {
  const articleUrl =
    `${siteUrl}/articles/${encodeURIComponent(article.slug)}/`;

  const pubDate = article.date
    ? new Date(article.date)
    : null;

  const validDate = pubDate && !isNaN(pubDate.getTime());

  return `
    <item>
      <title>${escapeXML(article.title || article.slug)}</title>
      <link>${escapeXML(articleUrl)}</link>
      <guid isPermaLink="true">${escapeXML(articleUrl)}</guid>
      <description>${escapeXML(
        article.description || article.subtitle || ""
      )}</description>
      <author>${escapeXML(article.author || "Akriti Charak")}</author>
      ${validDate ? `<pubDate>${pubDate.toUTCString()}</pubDate>` : ""}
    </item>
  `;
}).join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Heartbeats &amp; Hypotheses</title>
    <link>${siteUrl}</link>
    <description>Where science meets the human experience.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

fs.writeFileSync(
  path.join(root, "rss.xml"),
  rss,
  "utf8"
);

console.log("RSS feed generated successfully!");
console.log(`Built ${articles.length} article(s).`);
