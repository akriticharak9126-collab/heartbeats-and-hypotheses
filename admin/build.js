
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

function getTheme(category = "") {
  const value = String(category).toLowerCase();

  if (value.includes("marine") || value.includes("ocean")) return "ocean";
  if (value.includes("neuro") || value.includes("brain")) return "neuro";
  if (value.includes("genetic") || value.includes("gene")) return "genetics";
  if (value.includes("ecology") || value.includes("environment")) return "ecology";

  return "general";
}

function getImagePath(image = "") {
  if (!image) return "";
  if (/^https?:\/\//i.test(image) || image.startsWith("/")) return image;
  return "/" + image.replace(/^\.?\//, "");
}

function readingTime(content = "") {
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

if (!fs.existsSync(articlesDir)) {
  throw new Error("The articles folder was not found.");
}

if (!fs.existsSync(homepagePath)) {
  throw new Error("The homepage index.html was not found.");
}

const files = fs.readdirSync(articlesDir)
  .filter(file => file.endsWith(".md"));

const articles = files.map(file => {
  const raw = fs.readFileSync(path.join(articlesDir, file), "utf8");
  const parsed = matter(raw);
  const data = parsed.data;
  const slug = path.basename(file, ".md");

  return {
    ...data,
    slug,
    body: data.body || parsed.content
  };
}).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

// Generate homepage article cards
const cards = articles.map(article => {
  const theme = getTheme(article.category);
  const title = escapeHTML(article.title || article.slug);
  const description = escapeHTML(article.description || article.subtitle || "");
  const category = escapeHTML(article.category || "Science");
  const author = escapeHTML(article.author || "Akriti Charak");

  return `
    <article class="journal-card theme-${theme}">
      <span class="card-category">${category}</span>
      <p>${author}</p>
      <h3>${title}</h3>
      <p>${description}</p>
      <a href="/articles/${encodeURIComponent(article.slug)}/">
        Explore the story →
      </a>
    </article>
  `;
}).join("\n");

let homepage = fs.readFileSync(homepagePath, "utf8");

const articleListPattern = /(<div id="article-list">)[\s\S]*?(<\/div>)/;

if (articleListPattern.test(homepage)) {
  homepage = homepage.replace(
    articleListPattern,
    (match, opening, closing) =>
      `${opening}${cards || "<p>New stories are on their way. Stay curious.</p>"}${closing}`
  );
  fs.writeFileSync(homepagePath, homepage);
} else {
  console.warn("Article list container was not found on the homepage.");
}

// Shared design for every article
const articleStyles = `
* { box-sizing: border-box; }

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  background: #10131b;
  color: #f2f0ec;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.75;
}

a { color: inherit; }

.site-header {
  padding: 22px 7%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid rgba(255,255,255,.1);
}

.brand {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -.5px;
  text-decoration: none;
}

.site-nav {
  display: flex;
  gap: 24px;
  font-size: 13px;
}

.site-nav a {
  text-decoration: none;
  opacity: .75;
}

.site-nav a:hover { opacity: 1; }

.article-page {
  --accent: #69d9ca;
  --soft: rgba(105,217,202,.12);
  min-height: 100vh;
}

.theme-ocean {
  --accent: #64dfcb;
  --soft: rgba(100,223,203,.12);
}

.theme-neuro {
  --accent: #b8a2ff;
  --soft: rgba(184,162,255,.13);
}

.theme-genetics {
  --accent: #f29bcf;
  --soft: rgba(242,155,207,.12);
}

.theme-ecology {
  --accent: #c1d98b;
  --soft: rgba(193,217,139,.12);
}

.theme-general {
  --accent: #ffad91;
  --soft: rgba(255,173,145,.12);
}

.article-hero {
  position: relative;
  overflow: hidden;
  padding: 100px 8% 85px;
  background:
    radial-gradient(ellipse at 85% 15%, var(--soft), transparent 48%),
    linear-gradient(135deg, #171c29, #10131b 75%);
}

.article-hero::after {
  content: "";
  position: absolute;
  width: 330px;
  height: 330px;
  right: -100px;
  bottom: -180px;
  border: 1px solid var(--accent);
  border-radius: 50%;
  opacity: .18;
  box-shadow: 0 0 0 35px var(--soft), 0 0 0 75px rgba(255,255,255,.02);
  pointer-events: none;
}

.hero-inner {
  max-width: 1050px;
  margin: auto;
  position: relative;
  z-index: 1;
}

.eyebrow {
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 11px;
  font-weight: bold;
}

.article-hero h1 {
  max-width: 900px;
  margin: 24px 0;
  font-family: Georgia, serif;
  font-size: clamp(42px, 7vw, 82px);
  line-height: 1.06;
  letter-spacing: -3px;
}

.subtitle {
  max-width: 650px;
  color: #c0c4cf;
  font-size: 19px;
  line-height: 1.7;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 13px 25px;
  margin-top: 35px;
  color: #aeb4c0;
  font-size: 12px;
  letter-spacing: .5px;
}

.article-meta strong { color: #fff; }

.hero-image {
  display: block;
  width: min(100%, 1050px);
  max-height: 520px;
  object-fit: cover;
  margin: 55px auto 0;
  border-radius: 15px;
  border: 1px solid rgba(255,255,255,.13);
}

.article-layout {
  width: min(850px, 88%);
  margin: 75px auto 100px;
}

.article-body {
  color: #d4d6dc;
  font-size: 17px;
  line-height: 1.95;
}

.article-body h2,
.article-body h3 {
  color: #fff;
  font-family: Georgia, serif;
  line-height: 1.25;
  margin-top: 58px;
}

.article-body h2 { font-size: 35px; }
.article-body h3 { font-size: 25px; }

.article-body p { margin: 24px 0; }

.article-body a {
  color: var(--accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

.article-body blockquote {
  margin: 45px 0;
  padding: 24px 30px;
  border-left: 3px solid var(--accent);
  background: var(--soft);
  color: #fff;
  font-family: Georgia, serif;
  font-size: 23px;
}

.article-body img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 35px auto;
  border-radius: 12px;
}

.article-body ul,
.article-body ol { padding-left: 25px; }

.article-body li { margin: 10px 0; }

.article-body hr {
  border: 0;
  border-top: 1px solid rgba(255,255,255,.15);
  margin: 45px 0;
}

.article-footer {
  border-top: 1px solid rgba(255,255,255,.13);
  padding-top: 30px;
  margin-top: 70px;
}

.article-footer h3 {
  color: var(--accent);
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.article-footer p {
  color: #b9bdc8;
  font-size: 14px;
}

.back-link {
  display: inline-block;
  margin-top: 35px;
  color: var(--accent);
  text-decoration: none;
}

.site-footer {
  padding: 35px 8%;
  text-align: center;
  color: #858b98;
  border-top: 1px solid rgba(255,255,255,.1);
  font-size: 12px;
}

@media (max-width: 600px) {
  .site-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .site-nav { gap: 16px; }

  .article-hero { padding: 65px 7% 55px; }

  .article-hero h1 {
    font-size: 46px;
    letter-spacing: -1.5px;
  }

  .subtitle { font-size: 16px; }

  .hero-image { margin-top: 35px; }

  .article-layout { margin-top: 45px; }

  .article-body { font-size: 16px; }

  .article-body h2 { font-size: 29px; }
}
`;

// Generate each article page using the same template
for (const article of articles) {
  const pageDir = path.join(articlesDir, article.slug);
  fs.mkdirSync(pageDir, { recursive: true });

  const theme = getTheme(article.category);
  const title = escapeHTML(article.title || article.slug);
  const subtitle = escapeHTML(article.subtitle || article.description || "");
  const description = escapeHTML(article.description || "");
  const author = escapeHTML(article.author || "Akriti Charak");
  const category = escapeHTML(article.category || "Science");
  const date = formatDate(article.date);
  const time = readingTime(article.body);
  const imagePath = getImagePath(article.image);
  const image = imagePath
    ? `<img class="hero-image" src="${escapeHTML(imagePath)}" alt="${title}">`
    : "";

  const references = Array.isArray(article.references)
    ? article.references
    : typeof article.references === "string"
      ? article.references.split("\n").filter(Boolean)
      : [];

  const referencesHTML = references.length
    ? `<section class="article-footer">
        <h3>Further reading & references</h3>
        ${references.map(ref => `<p>${escapeHTML(ref)}</p>`).join("")}
      </section>`
    : "";

  const bodyHTML = marked.parse(article.body || "");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#10131b">
  <title>${title} | Heartbeats &amp; Hypotheses</title>
  <style>${articleStyles}</style>
</head>
<body>
  <div class="article-page theme-${theme}">
    <header class="site-header">
      <a class="brand" href="/">HEARTBEATS &amp; HYPOTHESES</a>
      <nav class="site-nav">
        <a href="/">Home</a>
        <a href="/#journal">Journal</a>
        <a href="/#about">About</a>
      </nav>
    </header>

    <section class="article-hero">
      <div class="hero-inner">
        <div class="eyebrow">${category} &nbsp; / &nbsp; FIELD NOTES</div>
        <h1>${title}</h1>
        <p class="subtitle">${subtitle}</p>
        <div class="article-meta">
          <span>BY <strong>${author}</strong></span>
          ${date ? `<span>${escapeHTML(date)}</span>` : ""}
          <span>${time} MIN READ</span>
        </div>
      </div>
      ${image}
    </section>

    <main class="article-layout">
      <article class="article-body">
        ${bodyHTML}
      </article>

      ${referencesHTML}

      <a class="back-link" href="/#journal">← Back to the journal</a>
    </main>

    <footer class="site-footer">
      HEARTBEATS &amp; HYPOTHESES
      <p>Where science meets the human experience.</p>
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(pageDir, "index.html"), html);
}

console.log(`Built ${articles.length} article(s).`);
