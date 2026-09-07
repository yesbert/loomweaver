import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
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

/* The two llms files are written for the repository, so their links are repo-relative: docs/x.md for
   a page, platform/... for a source file. Served from the site unchanged, every one of them was a
   404 for the assistant that fetched them. They are therefore rewritten on the way: a page becomes
   its absolute site address, anything else in the tree its address on GitHub. */
const LLMS = ['llms.txt', 'llms-full.txt'];

/** Images a page under docs/ embeds from assets/media; copied beside the landing media below. */
const docsMedia = new Set();
const GITHUB_BLOB = 'https://github.com/yesbert/loomweaver/blob/main/';

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

        if (resolved.startsWith('assets/media/') && existsSync(path.join(repoRoot, resolved))) {
          docsMedia.add(path.basename(resolved));
          return `${open}/media/${path.basename(resolved)}${suffix}${close}`;
        }

        problems.push(`${repoPath}: cannot resolve link target "${target}"`);
        return whole;
      });
    })
    .join('');
}

function rewriteLinksForSite(md, repoPath, knownTargets, site, problems) {
  return segments(md)
    .map(({ code, text }) => {
      if (code) return text;
      return text.replace(/(\[[^\]]*\]\()([^)\s]+)(\))/g, (whole, open, target, close) => {
        if (/^(https?:|mailto:|#)/.test(target)) return whole;
        const [file, anchor] = target.split('#');
        if (!file) return whole;
        const resolved = path.normalize(path.join(path.dirname(repoPath), file));
        const suffix = anchor ? `#${anchor}` : '';

        if (VERBATIM.includes(resolved)) return `${open}${site}/${resolved}${suffix}${close}`;

        const mapped = knownTargets.get(resolved);
        if (mapped) return `${open}${site}${mapped}${suffix}${close}`;

        if (existsSync(path.join(repoRoot, resolved))) {
          return `${open}${GITHUB_BLOB}${resolved}${suffix}${close}`;
        }

        problems.push(`${repoPath}: cannot resolve link target "${target}"`);
        return whole;
      });
    })
    .join('');
}

/* What a search result and a shared link show under the title. Derived rather than written, for the
   same reason the title is: a description typed beside the page is a second thing to keep true, and
   73 of these pages would be 73 opportunities to describe a page that has since moved on. What the
   page opens with is what the page is about — these documents were written that way. */
const DESCRIPTION_MAX = 160;
const DESCRIPTION_MIN = 90;
const LEAD_IN_MIN = 60;

/* Emphasis is stripped in pairs, never as loose delimiters: a lone rule leaves the closing marker
   behind, because the character before it is a word character. The two underscore rules also carry
   CommonMark's own restriction that `_` cannot open or close inside a word, which is what keeps an
   identifier like VIEW_STATE intact once its backticks are gone. */
const EMPHASIS = [
  [/\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*/g, '$1'],
  [/(?<![\w_])__(?=\S)([\s\S]+?)(?<=\S)__(?![\w_])/g, '$1'],
  [/\*(?=\S)([^*]+?)(?<=\S)\*/g, '$1'],
  [/(?<![\w_])_(?=\S)([^_]+?)(?<=\S)_(?![\w_])/g, '$1'],
];

/** Markdown down to the sentence a reader would have read aloud. */
function flatten(md) {
  const text = EMPHASIS.reduce((acc, [from, to]) => acc.replace(from, to), md)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\{@link\s+([^}|]+?)(?:\s*\|[^}]*)?\}/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/`+/g, '');
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Google has truncated around 160 characters for as long as anyone has measured it, and no engine
   cuts shorter. A whole sentence reads better than a clipped one, so a sentence boundary wins
   whenever it leaves enough text to be worth showing; below that the cut falls on a word. */
function clamp(text) {
  if (text.length <= DESCRIPTION_MAX) return text;
  const head = text.slice(0, DESCRIPTION_MAX + 1);
  const sentence = head.search(/[.!?](?=[^.!?]*$)/);
  if (sentence >= DESCRIPTION_MIN - 1) return head.slice(0, sentence + 1).trim();
  const word = text.slice(0, DESCRIPTION_MAX - 1).lastIndexOf(' ');
  return `${text.slice(0, word).replace(/[,;:]$/, '')}…`;
}

/* A paragraph that ends in a colon is leading into a list or a code block the description cannot
   show, so it reads as though it were cut off. Drop the lead-in when the sentence before it can
   stand alone; otherwise let the colon become the full stop it is standing in for. */
function settle(text) {
  if (!text.endsWith(':')) return text;
  const previous = text.slice(0, -1).search(/[.!?](?=[^.!?]*$)/);
  return previous >= LEAD_IN_MIN - 1
    ? text.slice(0, previous + 1)
    : `${text.slice(0, -1).trimEnd()}.`;
}

function description(body) {
  const prose = body
    .replace(/(^|\n)\s*(```|~~~)[\s\S]*?\n\s*\2[^\n]*/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n\s*\n/);

  const opening = [];
  for (const block of prose) {
    const text = block.trim();
    if (!text) continue;
    if (/^(#{1,6}\s|[>|]|[-*+]\s|\d+\.\s|!\[|<)/.test(text)) continue;
    opening.push(flatten(text));
    if (opening.join(' ').length >= DESCRIPTION_MIN) break;
  }

  const joined = opening.join(' ').trim();
  return joined ? settle(clamp(joined)) : '';
}

function frontmatter(md, repoPath, updated, problems) {
  const match = md.match(/^#\s+(.+?)\s*$/m);
  if (!match || md.slice(0, match.index).trim() !== '') {
    problems.push(`${repoPath}: expected the file to start with a single "# Title" heading`);
    return md;
  }
  const title = match[1].replace(/`/g, '');
  const body = md.slice(0, match.index) + md.slice(match.index + match[0].length);
  const summary = description(body);
  if (!summary) {
    problems.push(
      `${repoPath}: no opening paragraph to derive a description from — every page needs one, ` +
        'or it ships with the site-wide fallback and says nothing about itself in a search result',
    );
  }
  const meta = [
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(summary)}`,
    `lastUpdated: ${updated}`,
  ];
  return `---\n${meta.join('\n')}\n---\n${body.replace(/^\n+/, '\n')}`;
}

const sources = execFileSync('git', ['ls-files', 'docs/*.md', 'docs/**/*.md'], {
  cwd: repoRoot,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean);

/* When each page last changed, for `lastmod` in the sitemap and `dateModified` in the structured
   data. One `git log` for the whole tree rather than one per file: the log walks newest first, so
   the first date a path appears under is the one that page was last touched. A shallow checkout
   has no such history, and the file's own mtime is then the closest true thing available. */
function lastModified(paths, pathspec) {
  const dates = new Map();
  let log = '';
  try {
    log = execFileSync(
      'git',
      ['log', '--pretty=format:%cI', '--name-only', '--no-merges', '--', ...pathspec],
      { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    );
  } catch {
    log = '';
  }

  let commit = '';
  for (const line of log.split('\n')) {
    if (!line.trim()) continue;
    if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
      commit = line.trim();
      continue;
    }
    if (commit && !dates.has(line)) dates.set(line, commit);
  }

  return new Map(
    paths.map((p) => [
      p,
      dates.get(p) ?? statSync(path.join(repoRoot, p)).mtime.toISOString(),
    ]),
  );
}

const modified = lastModified(sources, ['docs']);

const knownTargets = new Map(sources.map((s) => [s, routeFor(targetFor(s))]));

rmSync(contentDir, { recursive: true, force: true });
mkdirSync(contentDir, { recursive: true });

const problems = [];
for (const source of sources) {
  const raw = readFileSync(path.join(repoRoot, source), 'utf8');
  const withLinks = rewriteLinks(raw, source, knownTargets, problems);
  const page = frontmatter(withLinks, source, modified.get(source), problems);
  const target = path.join(contentDir, targetFor(source));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, page);
}

/* The same dates again, keyed by route, because astro.config.mjs needs them at a point where it has
   a URL and not a source path: `serialize` sees only the address the sitemap is about to write. The
   three pages that are not documentation are written by hand rather than synced, so they are dated
   from their own source files — otherwise the landing page is the one address with no `lastmod`. */
const HANDWRITTEN = {
  '/': 'website/src/pages/index.astro',
  '/imprint/': 'website/src/pages/imprint.astro',
  '/privacy/': 'website/src/pages/privacy.astro',
};
const handwrittenDates = lastModified(Object.values(HANDWRITTEN), ['website/src/pages']);

writeFileSync(
  path.join(websiteRoot, 'generated/page-meta.json'),
  `${JSON.stringify(
    {
      ...Object.fromEntries(sources.map((s) => [routeFor(targetFor(s)), modified.get(s)])),
      ...Object.fromEntries(
        Object.entries(HANDWRITTEN).map(([route, file]) => [route, handwrittenDates.get(file)]),
      ),
    },
    null,
    2,
  )}\n`,
);

/* The version the structured data reports. Directory.Build.props is the single source that
   scripts/bump-version.sh writes and the release workflow verifies against the tag; a literal here
   would be one more place a version can be wrong, and the one nobody would think to check. */
const propsSource = readFileSync(path.join(repoRoot, 'Directory.Build.props'), 'utf8');
const version = propsSource.match(/<Version>([^<]+)<\/Version>/)?.[1];
if (!version) {
  problems.push('Directory.Build.props declares no <Version> — the structured data cannot state one');
}
writeFileSync(
  path.join(websiteRoot, 'generated/site-meta.json'),
  `${JSON.stringify({ version: version ?? null }, null, 2)}\n`,
);

/* The site address is read from astro.config.mjs rather than written twice: the sitemap integration
   builds its URLs from that same value, so a second copy here could disagree with the file it points
   at. It names the sitemap in robots.txt and makes the llms links absolute. */
const configSource = readFileSync(path.join(websiteRoot, 'astro.config.mjs'), 'utf8');
const site = configSource.match(/site:\s*'([^']+)'/)?.[1];

mkdirSync(publicDir, { recursive: true });
for (const file of VERBATIM) {
  const from = path.join(repoRoot, file);
  if (!existsSync(from)) {
    problems.push(`missing repo file the site links to: ${file}`);
    continue;
  }
  if (LLMS.includes(file) && site) {
    const rewritten = rewriteLinksForSite(readFileSync(from, 'utf8'), file, knownTargets, site, problems);
    writeFileSync(path.join(publicDir, file), rewritten);
  } else {
    copyFileSync(from, path.join(publicDir, file));
  }
}

/** The assistants and answer engines that fetch these pages, each of which honours its own name. */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
  'Amazonbot',
  'meta-externalagent',
];

/* A crawler that reads only robots.txt never learns the sitemap exists, and every page here is meant
   to be found. */
if (site) {
  writeFileSync(
    path.join(publicDir, 'robots.txt'),
    [
      '# Everything here is meant to be found. For assistants, the curated map is',
      `# ${site}/llms.txt, and the whole contract in one fetch is ${site}/llms-full.txt.`,
      '',
      'User-agent: *',
      'Allow: /',
      '',
      '# Named explicitly rather than left to the wildcard above, which already permits them: a',
      '# crawler that looks for its own name first should find a stated answer, not an inference.',
      ...AI_CRAWLERS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', '']),
      `Sitemap: ${site}/sitemap-index.xml`,
      '',
    ].join('\n'),
  );
} else {
  problems.push('astro.config.mjs declares no site, so robots.txt cannot name the sitemap');
}

/* The landing page is src/pages/index.astro, so nothing is copied into the docs collection for
   the root route. What it does need is its media, single-sourced in assets/media so the README and
   the site show the same tour. A missing file fails the build rather than shipping a broken image. */
const mediaDir = path.join(publicDir, 'media');
mkdirSync(mediaDir, { recursive: true });
for (const asset of [
  ...docsMedia,
  'agent-panel-dark.png',
  'agent-panel-light.png',
  'command-palette-dark.png',
  'command-palette-light.png',
  'plugin-consent-dark.png',
  'plugin-consent-light.png',
  'quick-open-dark.png',
  'quick-open-light.png',
  'split-panes-dark.png',
  'split-panes-light.png',
  'tab-menu-dark.png',
  'tab-menu-light.png',
  'workspace-dialog-dark.png',
  'workspace-dialog-light.png',
  'tour-dark.webm',
  'tour-dark.mp4',
  'tour-dark-poster.jpg',
  'tour-light.webm',
  'tour-light.mp4',
  'tour-light-poster.jpg',
]) {
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
for (const asset of ['loomweaver-icon-256.png', 'loomweaver-logo-full.png']) {
  const from = path.join(repoRoot, 'assets/brand', asset);
  if (!existsSync(from)) {
    problems.push(`missing brand asset: assets/brand/${asset}`);
    continue;
  }
  copyFileSync(from, path.join(assetsDir, asset));
}

/* Served as-is at a fixed address, because a <link rel="icon"> and an og:image are written by hand
   in the head component and cannot name a hashed build asset. The card is 1200×630 and drawn once:
   nothing renders an image during this build, which is what keeps the passthrough image service —
   and the absence of sharp's LGPL binary — a decision rather than an accident. */
for (const asset of [
  'social-card.png',
  'icon-32.png',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
]) {
  const from = path.join(repoRoot, 'assets/brand', asset);
  if (!existsSync(from)) {
    problems.push(`missing brand asset: assets/brand/${asset}`);
    continue;
  }
  copyFileSync(from, path.join(publicDir, asset));
}

/* Every page has to be reachable from the sidebar. Starlight's `autogenerate` cannot do that for us:
   it derives the tree from its own collection, and these pages come from our glob() loader, so the
   group rendered empty and the pages were navigable only through inline links and search. The list
   in sidebar.mjs is therefore hand-kept, and this check is what keeps it honest when someone
   adds a page. It covers guides as well as reference pages: a guide nobody can reach is the same
   defect, and it was the likelier one, because guides used to go unchecked. */
const sidebarSource = readFileSync(path.join(websiteRoot, 'sidebar.mjs'), 'utf8');
const pagesUnder = (dir, prefix) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? pagesUnder(path.join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  );
for (const page of pagesUnder(contentDir, '')) {
  if (!/\.mdx?$/.test(page)) continue;
  const route = `/${page.replace(/\.mdx?$/, '')}/`.replace(/\/index\/$/, '/');
  if (!sidebarSource.includes(route)) {
    problems.push(
      `docs/${page} is not linked from the sidebar in sidebar.mjs — add it, or it is reachable only through search`,
    );
  }
}

/* And every page has to be in llms.txt, the index an assistant reads instead of the sidebar. The
   same hand-kept list, the same drift: a page that is not in it exists for a reader and not for a
   model. The link is repo-relative in the source file, docs/<page>, which is what is checked. */
const llmsIndex = readFileSync(path.join(repoRoot, 'llms.txt'), 'utf8');
for (const page of pagesUnder(contentDir, '')) {
  if (!/\.mdx?$/.test(page)) continue;
  const source = page === 'overview.md' ? 'README.md' : page;
  if (!llmsIndex.includes(`(docs/${source})`)) {
    problems.push(
      `docs/${source} is not linked from llms.txt — add it with a one-line hook, or an assistant never learns it exists`,
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
