/**
 * What every built page has to carry before it is worth publishing.
 *
 * The site once shipped seventy-three pages sharing one meta description, `twitter:card` declaring
 * a large image and no image anywhere to go with it, and no structured data at all. None of that
 * showed up in a build log, a test or a review — it is invisible unless something looks. This is
 * the thing that looks, and it reads `dist/`, because the question is what a crawler is served,
 * not what the source intended.
 *
 * Deliberately offline: the schema.org vocabulary is a 1.5 MB fetch, and a check that needs the
 * network is a check that fails for the wrong reason. Type and property names were validated
 * against the published vocabulary once, by hand; what can rot without anyone noticing is a
 * reference that stops resolving, and that is answerable from the document alone.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteRoot = path.resolve(fileURLToPath(import.meta.url), '../..');
const dist = path.join(websiteRoot, 'dist');

const FALLBACK = 'LoomWeaver: open-source plugin platform for Angular workbenches.';

function pages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return pages(full);
    return entry.name === 'index.html' ? [full] : [];
  });
}

const attribute = (html, pattern) => pattern.exec(html)?.[1];
const meta = (html, name) =>
  attribute(html, new RegExp(`<meta\\s+(?:name|property)="${name}"\\s+content="([^"]*)"`));

const problems = [];
const descriptions = new Map();
let checked = 0;

for (const file of pages(dist)) {
  const where = path.relative(dist, file);
  const html = readFileSync(file, 'utf8');

  // The redirect stubs are three tags and a link; they carry noindex and a canonical, and nothing
  // else belongs in them.
  if (/<meta name="robots" content="noindex">/.test(html) && html.length < 1000) continue;
  checked += 1;

  const description = meta(html, 'description');
  if (!description) problems.push(`${where}: no meta description`);
  else if (description === FALLBACK) problems.push(`${where}: still on the site-wide fallback description`);
  else if (description.length > 200) problems.push(`${where}: description is ${description.length} characters`);
  else {
    const seen = descriptions.get(description);
    if (seen) problems.push(`${where}: shares its description with ${seen}`);
    else descriptions.set(description, where);
  }

  for (const tag of ['og:image', 'og:image:alt', 'twitter:image', 'theme-color']) {
    if (!meta(html, tag)) problems.push(`${where}: no ${tag}`);
  }

  const image = meta(html, 'og:image');
  if (image && !image.startsWith('https://')) {
    problems.push(`${where}: og:image "${image}" is not absolute — scrapers do not resolve it`);
  }

  if (!/rel="apple-touch-icon"/.test(html)) problems.push(`${where}: no apple-touch-icon`);
  if (/href="\/favicon\.svg"/.test(html)) problems.push(`${where}: points at /favicon.svg, which this site does not ship`);

  const block = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
  if (!block) {
    problems.push(`${where}: no structured data`);
    continue;
  }

  let graph;
  try {
    graph = JSON.parse(block)['@graph'];
  } catch (error) {
    problems.push(`${where}: structured data is not valid JSON — ${error.message}`);
    continue;
  }

  if (!Array.isArray(graph) || graph.length === 0) {
    problems.push(`${where}: structured data carries no @graph`);
    continue;
  }

  const ids = new Set(graph.map((node) => node['@id']).filter(Boolean));
  const walk = (node, trail) => {
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item && typeof item === 'object') {
          if (Object.keys(item).length === 1 && item['@id']) {
            if (!ids.has(item['@id'])) {
              problems.push(`${where}: ${trail}.${key} references ${item['@id']}, absent from its @graph`);
            }
          } else {
            walk(item, `${trail}.${key}`);
          }
        }
      }
    }
  };
  for (const node of graph) walk(node, node['@type'] ?? '?');

  const types = new Set(graph.map((node) => node['@type']));
  if (!types.has('WebSite') || !types.has('Organization')) {
    problems.push(`${where}: structured data names no WebSite and Organization`);
  }
  if (!types.has('SoftwareApplication')) {
    problems.push(`${where}: structured data never says what software it is about`);
  }

  const version = graph.find((node) => node['@type'] === 'SoftwareApplication')?.softwareVersion;
  if (!version) problems.push(`${where}: the SoftwareApplication states no softwareVersion`);
}

const sitemap = readFileSync(path.join(dist, 'sitemap-0.xml'), 'utf8');
const locations = sitemap.match(/<loc>/g)?.length ?? 0;
const stamps = sitemap.match(/<lastmod>/g)?.length ?? 0;
if (locations !== stamps) {
  problems.push(`sitemap: ${locations} urls but ${stamps} lastmod stamps`);
}

const robots = readFileSync(path.join(dist, 'robots.txt'), 'utf8');
for (const expected of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Sitemap:', 'llms.txt']) {
  if (!robots.includes(expected)) problems.push(`robots.txt does not mention ${expected}`);
}

if (problems.length > 0) {
  console.error(`\ncheck-head failed with ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `check-head: ${checked} pages carry a description of their own, a social card, an icon set ` +
    `and structured data whose references resolve; ${locations} sitemap entries are dated`,
);
