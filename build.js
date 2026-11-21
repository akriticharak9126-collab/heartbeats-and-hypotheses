
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const root = process.cwd();
const articlesDir = path.join(root, "articles");
const homepagePath = path.join(root, "index.html");

const siteUrl = "https://heartbeats-and-hypotheses-trfy.vercel.app";

const DEFAULT_AUTHOR = "Akriti Charak";

const AUTHOR_BIO =
  "Hi, I'm Akriti. I write Heartbeats & Hypotheses to explore the quiet intersections where scientific research meets everyday human emotion. When I'm not reading papers or visiting local wildlife spaces, I'm usually asking way too many questions about how we live alongside the natural world.";

// =====================================
// HELPERS
// =====================================

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

function safeUrl(value = "") {
  const url = String(value).trim();

  if (/^(https?:\/\/|\/|\.\/|\.\.\/|#)/i.test(url)) {
    return escapeHTML(url);
  }

  return "#";
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

function getReadingTime(content = "") {
  const plainText = String(content)
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/[#>*_`~\-]/g, " ")
    .trim();

  const words = plainText
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
}

function getArticleImage(image, articlePage = false) {
  if (!image) return "";

  const value = String(image).trim();

  if (/^(https?:\/\/|\/)/i.test(value)) {
    return escapeHTML(value);
  }

  return escapeHTML(
    articlePage ? `../../${value}` : value
  );
}

function renderReferences(references) {
  if (!Array.isArray(references) || !references.length) {
    return "";
  }

  const items = references.map(reference => {
    if (typeof reference === "string") {
      return `<li>${escapeHTML(reference)}</li>`;
    }

    if (reference && typeof reference === "object") {
      const title = escapeHTML(
        reference.title || reference.name || "Source"
      );

      const url = reference.url
        ? safeUrl(reference.url)
        : "";

      return `<li>
        ${url !== "#"
          ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`
          : title}
        ${reference.note
          ? ` — ${escapeHTML(reference.note)}`
          : ""}
      </li>`;
    }

    return "";
  }).join("\n");

  return `
    <details class="article-sources">
      <summary>Sources & Further Reading</summary>
      <ul>${items}</ul>
    </details>
  `;
}

// =====================================
// CREATE ARTICLES DIRECTORY
// =====================================

if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
  console.log("Created articles folder.");
}

// =====================================
// READ MARKDOWN ARTICLES
// =====================================

const files = fs.readdirSync(articlesDir)
  .filter(file => file.endsWith(".md"));

const articles = files.map(file => {
  const raw = fs.readFileSync(
    path.join(articlesDir, file),
    "utf8"
  );

  const parsed = matter(raw);
  const data = parsed.data;

  const slug = path.basename(file, ".md");

  const body = data.body || parsed.content;

  return {
    ...data,
    slug,
    body,
    title: data.title || slug,
    author: data.author || DEFAULT_AUTHOR,
    category: data.category || "Journal",
    description: data.description || data.subtitle || "",
    readingTime: getReadingTime(body)
  };
}).sort((a, b) =>
  new Date(b.date || 0) - new Date(a.date || 0)
);

// =====================================
// GENERATE HOMEPAGE JOURNAL CARDS
// =====================================

const cards = articles.map(article => {
  const image = article.image
    ? `<img
        src="${getArticleImage(article.image)}"
        alt="${escapeHTML(article.title)}"
        loading="lazy"
      >`
    : "";

  return `
    <article class="journal-card">
      ${image}

      <p>${escapeHTML(article.category)}</p>

      <h3>${escapeHTML(article.title)}</h3>

      <p>${escapeHTML(article.description)}</p>

      <a href="/articles/${encodeURIComponent(article.slug)}/">
        Read the article →
      </a>
    </article>
  `;
}).join("\n");

// =====================================
// UPDATE HOMEPAGE
// =====================================

let homepage = fs.readFileSync(homepagePath, "utf8");

const articleListPattern =
  /(<div id="article-list">)[\s\S]*?(<\/div>)/;

if (articleListPattern.test(homepage)) {
  homepage = homepage.replace(
    articleListPattern,
    `$1${cards || "<p>New stories are on their way. Stay curious.</p>"}$2`
  );

  fs.writeFileSync(homepagePath, homepage);
  console.log("Homepage journal updated.");
} else {
  console.warn(
    "Could not find #article-list in index.html. Homepage left unchanged."
  );
}

// =====================================
// GENERATE INDIVIDUAL ARTICLE PAGES
// =====================================

for (let index = 0; index < articles.length; index++) {

  const article = articles[index];

  const nextArticle = articles[index + 1];

  const pageDir = path.join(articlesDir, article.slug);

  fs.mkdirSync(pageDir, { recursive: true });

  const title = escapeHTML(article.title);
  const description = escapeHTML(article.description);
  const category = escapeHTML(article.category);
  const author = escapeHTML(article.author);

  const formattedDate = formatDate(article.date);

  const image = article.image
    ? `<img
        src="${getArticleImage(article.image, true)}"
        alt="${title}"
        loading="eager"
      >`
    : "";

  const imageCaption = article.imageCaption
    ? `<p class="article-image-caption">
        ${escapeHTML(article.imageCaption)}
      </p>`
    : "";

  const heroImage = image
    ? `<div class="article-cover">
        ${image}
        ${imageCaption}
      </div>`
    : "";

  // -----------------------------------
  // ARTICLE METADATA
  // -----------------------------------

  const metadata = [
    `By ${author}`,
    formattedDate,
    `${article.readingTime} min read`
  ].join(" • ");

  // -----------------------------------
  // SOURCES
  // -----------------------------------

  const sources = renderReferences(
    article.references || article.sources
  );

  // -----------------------------------
  // AUTHOR IMAGE
  // -----------------------------------

  const authorImage = article.authorImage
    ? `<img
        src="${getArticleImage(article.authorImage, true)}"
        alt="Portrait of ${author}"
        loading="lazy"
      >`
    : "";

  // -----------------------------------
  // AUTHOR CARD
  // -----------------------------------

  const authorCard = `
    <section class="author-card">

      ${authorImage}

      <div>
        <h3>Written by ${author}</h3>

        <p>${escapeHTML(AUTHOR_BIO)}</p>

        <a href="/#about">More about me →</a>

        &nbsp;&nbsp;

        <a href="/#journal">Explore the journal →</a>
      </div>

    </section>
  `;

  // -----------------------------------
  // READ NEXT
  // -----------------------------------

  let readNext = "";

  if (nextArticle) {

    const nextImage = nextArticle.image
      ? `<img
          src="${getArticleImage(nextArticle.image, true)}"
          alt="${escapeHTML(nextArticle.title)}"
          loading="lazy"
        >`
      : "";

    readNext = `
      <section class="read-next">

        <p class="read-next-label">IF YOU ENJOYED THIS STORY</p>

        <a
          class="read-next-card"
          href="/articles/${encodeURIComponent(nextArticle.slug)}/"
        >

          ${nextImage}

          <div>
            <h3>${escapeHTML(nextArticle.title)}</h3>

            <p>${escapeHTML(nextArticle.description)}</p>

            <span>Read next →</span>
          </div>

        </a>

      </section>
    `;
  }

  // -----------------------------------
  // ARTICLE HTML
  // -----------------------------------

  const html = `<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1">

  <meta name="description" content="${description}">

  <meta name="author" content="${author}">

  <meta property="og:title" content="${title}">

  <meta property="og:description" content="${description}">

  <meta property="og:type" content="article">

  ${article.image
    ? `<meta property="og:image" content="${escapeHTML(
        /^https?:\/\//i.test(article.image)
          ? article.image
          : siteUrl + "/" + String(article.image).replace(/^\/+/, "")
      )}">`
    : ""}

  <title>${title} | Heartbeats & Hypotheses</title>

  <link rel="stylesheet" href="../../style.css">

</head>

<body class="article-page">

  <!-- READING PROGRESS -->

  <div class="reading-progress">
    <div class="reading-progress-bar" id="reading-progress-bar"></div>
  </div>

  <!-- HEADER -->

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

  <!-- ARTICLE -->

  <main class="article-container">

    <a href="/#journal" class="article-back">
      ← Back to the journal
    </a>

    <!-- ARTICLE TITLE -->

    <header class="article-heading">

      <p class="article-kicker">${category}</p>

      <h1>${title}</h1>

      ${description
        ? `<p class="article-subtitle">${description}</p>`
        : ""}

      <div class="article-meta">
        <span>${escapeHTML(metadata)}</span>
      </div>

    </header>

    <!-- HERO IMAGE -->

    ${heroImage}

    <!-- ARTICLE CONTENT -->

    <article class="article-body">

      ${marked.parse(article.body || "")}

    </article>

    <!-- REFERENCES -->

    ${sources}

    <!-- AUTHOR SIGN-OFF -->

    ${authorCard}

    <!-- READ NEXT -->

    ${readNext}

    <!-- ENDING -->

    <footer class="article-ending">

      <span>♡</span>

      <p>Thank you for being curious.</p>

      <a href="/#journal">
        Explore more stories →
      </a>

    </footer>

  </main>

  <!-- FOOTER -->

  <footer class="article-footer">

    <p>Heartbeats & Hypotheses</p>

    <span>Where science meets the human experience.</span>

  </footer>

  <!-- READING PROGRESS SCRIPT -->

  <script>
    (function () {

      const progressBar = document.getElementById(
        "reading-progress-bar"
      );

      function updateProgress() {

        const scrollableHeight =
          document.documentElement.scrollHeight -
          window.innerHeight;

        const progress = scrollableHeight > 0
          ? (window.scrollY / scrollableHeight) * 100
          : 0;

        progressBar.style.width =
          Math.min(100, Math.max(0, progress)) + "%";
      }

      window.addEventListener("scroll", updateProgress, {
        passive: true
      });

      window.addEventListener("resize", updateProgress);

      updateProgress();

    })();
  </script>

</body>

</html>`;

  fs.writeFileSync(
    path.join(pageDir, "index.html"),
    html,
    "utf8"
  );
}

// =====================================
// GENERATE XML SITEMAP
// =====================================

const sitemapUrls = [
  `${siteUrl}/`,
  ...articles.map(article =>
    `${siteUrl}/articles/${encodeURIComponent(article.slug)}/`
  )
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${sitemapUrls.map(url =>
  `<url><loc>${escapeXML(url)}</loc></url>`
).join("\n")}

</urlset>`;

fs.writeFileSync(
  path.join(root, "sitemap.xml"),
  sitemap,
  "utf8"
);

console.log("Sitemap generated successfully!");

// =====================================
// GENERATE RSS FEED
// =====================================

const rssItems = articles.map(article => {

  const articleUrl =
    `${siteUrl}/articles/${encodeURIComponent(article.slug)}/`;

  const pubDate = article.date
    ? new Date(article.date)
    : null;

  const validDate =
    pubDate && !isNaN(pubDate.getTime());

  return `
    <item>

      <title>${escapeXML(article.title)}</title>

      <link>${escapeXML(articleUrl)}</link>

      <guid isPermaLink="true">${escapeXML(articleUrl)}</guid>

      <description>${escapeXML(article.description)}</description>

      <author>${escapeXML(article.author)}</author>

      ${validDate
        ? `<pubDate>${pubDate.toUTCString()}</pubDate>`
        : ""}

    </item>
  `;

}).join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0">

  <channel>

    <title>Heartbeats &amp; Hypotheses</title>

    <link>${siteUrl}</link>

    <description>
      Where science meets the human experience.
    </description>

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

console.log(
  `Built ${articles.length} article(s).`
);
