import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function stripHtml(str) {
  return String(str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJson(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export default function handler(req, res) {
  const id = String(req.query.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const cwd = process.cwd();

  let html = readFileSync(join(cwd, 'blog', 'post-template.html'), 'utf-8');

  if (id) {
    try {
      let post;
      const postPath = join(cwd, 'blog', 'posts', id + '.json');
      if (existsSync(postPath)) {
        post = JSON.parse(readFileSync(postPath, 'utf-8'));
      }

      if (post) {
        const rawTitle = stripHtml(post.seo_title || post.title).replace(/\s*\|\s*עומר טייכר\s*$/g, '');
        const title = escapeAttr(rawTitle + ' | עומר טייכר');
        const desc = escapeAttr(stripHtml(post.seo_desc || post.excerpt));
        const baseUrl = `https://${req.headers.host}`;
        const url = `${baseUrl}/blog/${encodeURIComponent(id)}`;
        const image = escapeAttr(post.image || '');

        // Schema.org placeholders
        const schemaTitle = escapeJson(rawTitle);
        const schemaDesc = escapeJson(stripHtml(post.seo_desc || post.excerpt));
        const schemaDate = post.date || '';
        const schemaDateModified = post.date_modified || schemaDate;
        const schemaImage = post.image || '';
        const schemaUrl = `https://omertai.net/blog/${encodeURIComponent(id)}`;

        // Build FAQ schema from body if it has h2 question patterns
        let faqSchema = '';
        const bodyText = post.body || '';
        const h2Matches = bodyText.match(/<h2[^>]*>([^<]+\?)<\/h2>/g);
        if (h2Matches && h2Matches.length >= 2) {
          const faqEntries = [];
          h2Matches.forEach(function(h2) {
            const question = h2.replace(/<[^>]+>/g, '').trim();
            const afterH2 = bodyText.split(h2)[1] || '';
            const nextSection = afterH2.split(/<h2/)[0] || '';
            const answerText = nextSection.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
            if (answerText.length > 20) {
              faqEntries.push({ q: escapeJson(question), a: escapeJson(answerText) });
            }
          });
          if (faqEntries.length >= 2) {
            faqSchema = JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqEntries.map(function(e) {
                return {
                  "@type": "Question",
                  "name": e.q,
                  "acceptedAnswer": { "@type": "Answer", "text": e.a }
                };
              })
            });
          }
        }

        html = html
          .replace('<title id="page-title">עומר טייכר - הבלוג</title>',
                   `<title id="page-title">${title}</title>`)
          .replace('<meta name="description" id="page-desc" content="">',
                   `<meta name="description" id="page-desc" content="${desc}">`)
          .replace('<meta property="og:title"       content="" id="og-title">',
                   `<meta property="og:title"       content="${title}" id="og-title">`)
          .replace('<meta property="og:description" content="" id="og-desc">',
                   `<meta property="og:description" content="${desc}" id="og-desc">`)
          .replace('<meta property="og:url"         content="" id="og-url">',
                   `<meta property="og:url"         content="${url}" id="og-url">`)
          .replace('<meta property="og:image"       content="" id="og-image">',
                   `<meta property="og:image"       content="${image}" id="og-image">`)
          .replace('<meta name="twitter:title" content="" id="tw-title">',
                   `<meta name="twitter:title" content="${title}" id="tw-title">`)
          .replace('<meta name="twitter:description" content="" id="tw-desc">',
                   `<meta name="twitter:description" content="${desc}" id="tw-desc">`)
          .replace('<meta name="twitter:image" content="" id="tw-image">',
                   `<meta name="twitter:image" content="${image}" id="tw-image">`)
          .replace('<link rel="canonical" id="canonical-url" href="/">',
                   `<link rel="canonical" id="canonical-url" href="${url}">`)
          .replace(/\{\{SCHEMA_TITLE\}\}/g, schemaTitle)
          .replace(/\{\{SCHEMA_DESC\}\}/g, schemaDesc)
          .replace(/\{\{SCHEMA_DATE\}\}/g, schemaDate)
          .replace(/\{\{SCHEMA_DATE_MODIFIED\}\}/g, schemaDateModified)
          .replace(/\{\{SCHEMA_IMAGE\}\}/g, schemaImage)
          .replace(/\{\{SCHEMA_URL\}\}/g, schemaUrl);

        // Inject FAQ schema or remove the empty script tag entirely
        if (faqSchema) {
          html = html.replace('{{SCHEMA_FAQ}}', faqSchema);
        } else {
          html = html.replace(/\s*<script type="application\/ld\+json" id="schema-faq">\s*\{\{SCHEMA_FAQ\}\}\s*<\/script>/, '');
        }
      }
    } catch (e) {
      console.error('OG injection error:', e);
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
  res.status(200).send(html);
}
