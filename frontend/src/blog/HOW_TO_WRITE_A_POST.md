# How to Write a Sol Blog Post

## Step 1 — Create the file
Copy any existing .md file in `frontend/src/blog/posts/`
Rename it to `your-post-slug.md`
(use hyphens, lowercase, no spaces)

## Step 2 — Update the frontmatter
Change the top section between `---` and `---`:
```
---
title: "Your Title Here With Keyword"
slug: your-post-slug
description: "150-160 characters. Contains keyword. Makes people click."
date: 2026-04-22
tags: [tag1, tag2, tag3]
readTime: 5
---
```

## Step 3 — Write the article
- Use `## ` for headings (creates H2)
- Use `**text**` for bold
- Use `[link text](/auth)` for internal links
- Use `[link text](https://...)` for external links

Minimum 800 words.

## Step 4 — Register it
Open `frontend/src/blog/posts/index.js`
Add one object to the posts array:
```js
{
  slug: "your-post-slug",
  title: "Your Title Here With Keyword",
  description: "Same as frontmatter description.",
  date: "2026-04-22",
  tags: ["tag1", "tag2"],
  readTime: 5,
},
```

## Step 5 — Add to sitemap
Open `frontend/public/sitemap.xml`
Add:
```xml
<url>
  <loc>https://talktosol.online/blog/your-post-slug</loc>
  <lastmod>2026-04-22</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

## Step 6 — Deploy
Push to git. Done.

---

## SEO checklist before publishing
- [ ] Slug matches what people search for
- [ ] Title contains the keyword
- [ ] Description is 150-160 chars
- [ ] Keyword in first paragraph
- [ ] At least 3 H2 headings
- [ ] At least 2 internal links (one to /auth)
- [ ] 800+ words
- [ ] Added to index.js
- [ ] Added to sitemap.xml

---

## Article structure that works
1. **Hook** — describe the feeling they're already having
2. **Validation** — tell them it makes sense
3. **The why** — explain what's actually happening
4. **What it means** — help them understand themselves
5. **What actually helps** — practical, specific, not generic
6. **Soft CTA** — link to Sol naturally ("that's what Sol is for")
7. **Crisis resources** — if the topic is heavy
