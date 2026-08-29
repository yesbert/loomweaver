import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteRoot = path.resolve(fileURLToPath(import.meta.url), '../..');
const repoRoot = path.resolve(websiteRoot, '..');
const contentDir = path.join(websiteRoot, 'generated/docs');
const publicDir = path.join(websiteRoot, 'public');

/** Repo-root files the site serves verbatim, so docs may link to them. */
const VERBATIM = ['llms.txt', 'llms-full.txt', 'LICENSE', 'NOTICE'];

/** Source markdown → path under generated/docs. */
function targetFor(repoPath) {
  const rel = path.relative('docs', repoPath);
  if (rel === 'README.md') return 'overview.md';
  return rel;
}

/** Path under generated/docs → the route Starlight serves it at. */
function routeFor(target) {
  const withoutExt = target.replace(/\.md$/, '').split(path.sep).join('/');
  const trimmed = withoutExt.replace(/(^|\/)index$/, '');
  return trimmed ? `/${trimmed}/` : '/';
}

/**
 * Split markdown into segments, marking fenced blocks and inline code spans as
 * code. Link rewriting must never touch those: the ADRs describe link syntax in
 * prose (`[Name](url)`), and rewriting that would corrupt the text and fail the
 * resolve check on a target that was never a link.
 *
 * A whole link is matched before a code span so that a code-span label —
 * [`DirtySurface`](authoring-a-weaver.md) — stays one rewritable segment. Without
 * that, the backticks split the link across segments, the rewrite never sees it
 * and the raw `.md` href reaches the built site unreported. A code span that
 * merely *contains* link syntax still wins, because its backtick comes first.
 */
function segments(md) {
  const out = [];
  const pattern =
    /(^|\n)(\s*)(```|~~~)[\s\S]*?\n\s*\3[^\n]*|\[[^\]\n]*\]\([^)\s]+\)|`+[^`\n]*`+/g;
  let last = 0;
  for (const m of md.matchAll(pattern)) {
    if (m.index > last) out.push({ code: false, text: md.slice(last, m.index) });
    out.push({ code: !m[0].startsWith('['), text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < md.length) out.push({ code: false, text: md.slice(last) });
  return out;
}

function rewriteLinks(md, repoPath, knownTargets, problems) {
  return segments(md)
    .map(({ code, text }) => {
      if (code) return text;
      return text.replace(/(\[[^\]]*\]\()([^)\s]+)(\))/g, (whole, open, target, close) => {
        if (/^(https?:|mailto:|#|\/)/.test(target)) return whole;
        const [file, anchor] = target.split('#');
        if (!file) return whole;
        const resolved = path.normalize(path.join(path.dirname(repoPath), file));
        const suffix = anchor ? `#${anchor}` : '';

        if (VERBATIM.includes(resolved)) return `${open}/${resolved}${suffix}${close}`;

        const mapped = knownTargets.get(resolved);
        if (mapped) return `${open}${mapped}${suffix}${close}`;

        problems.push(`${repoPath}: cannot resolve link target "${target}"`);
        return whole;
      });
    })
    .join('');
}

function frontmatter(md, repoPath, problems) {
  const match = md.match(/^#\s+(.+?)\s*$/m);
  if (!match || md.slice(0, match.index).trim() !== '') {
    problems.push(`${repoPath}: expected the file to start with a single "# Title" heading`);
    return md;
  }
  const title = match[1].replace(/`/g, '');
  const body = md.slice(0, match.index) + md.slice(match.index + match[0].length);
  return `---\ntitle: ${JSON.stringify(title)}\n---\n${body.replace(/^\n+/, '\n')}`;
}

const sources = execFileSync('git', ['ls-files', 'docs/*.md', 'docs/**/*.md'], {
  cwd: repoRoot,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean);

const knownTargets = new Map(sources.map((s) => [s, routeFor(targetFor(s))]));

rmSync(contentDir, { recursive: true, force: true });
mkdirSync(contentDir, { recursive: true });

const problems = [];
for (const source of sources) {
  const raw = readFileSync(path.join(repoRoot, source), 'utf8');
  const withLinks = rewriteLinks(raw, source, knownTargets, problems);
  const page = frontmatter(withLinks, source, problems);
  const target = path.join(contentDir, targetFor(source));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, page);
}

mkdirSync(publicDir, { recursive: true });
for (const file of VERBATIM) {
  const from = path.join(repoRoot, file);
  if (!existsSync(from)) {
    problems.push(`missing repo file the site links to: ${file}`);
    continue;
  }
  copyFileSync(from, path.join(publicDir, file));
}

/* The landing page is src/pages/index.astro, so nothing is copied into the docs collection for
   the root route. What it does need is its media, single-sourced in assets/media so the README and
   the site show the same tour. A missing file fails the build rather than shipping a broken image. */
const mediaDir = path.join(publicDir, 'media');
mkdirSync(mediaDir, { recursive: true });
for (const asset of ['command-palette.png', 'tour.webm', 'tour.mp4', 'tour-poster.jpg']) {
  const from = path.join(repoRoot, 'assets/media', asset);
  if (!existsSync(from)) {
    problems.push(`missing landing media: assets/media/${asset}`);
    continue;
  }
  copyFileSync(from, path.join(mediaDir, asset));
}

/** Brand assets stay single-sourced in assets/brand; the site copies what it needs. */
const assetsDir = path.join(websiteRoot, 'generated/assets');
mkdirSync(assetsDir, { recursive: true });
for (const asset of ['loomweaver-icon.png', 'loomweaver-logo-full.png']) {
  const from = path.join(repoRoot, 'assets/brand', asset);
  if (!existsSync(from)) {
    problems.push(`missing brand asset: assets/brand/${asset}`);
    continue;
  }
  copyFileSync(from, path.join(assetsDir, asset));
  if (asset === 'loomweaver-icon.png') copyFileSync(from, path.join(publicDir, asset));
}

/* Every reference page has to be reachable from the sidebar. Starlight's `autogenerate` cannot do
   that for us: it derives the tree from its own collection, and these pages come from our glob()
   loader, so the group rendered empty and the pages were navigable only through inline links and
   search. The list in astro.config.mjs is therefore hand-kept, and this check is what keeps it
   honest when someone adds a file under docs/reference/. */
const sidebarSource = readFileSync(path.join(websiteRoot, 'astro.config.mjs'), 'utf8');
for (const file of readdirSync(path.join(contentDir, 'reference'))) {
  const slug = file.replace(/\.mdx?$/, '');
  if (!sidebarSource.includes(`/reference/${slug}/`)) {
    problems.push(
      `docs/reference/${file} is not linked from the sidebar in astro.config.mjs — add it, or it is reachable only through search`,
    );
  }
}

if (problems.length > 0) {
  console.error(`\nsync-docs failed with ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `sync-docs: ${sources.length} pages + ${VERBATIM.length} verbatim files, all links resolved`,
);
