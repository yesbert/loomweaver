/* The changelog page is generated from the GitHub release list at build time. The release
   workflow writes each release's notes from the pull requests merged since the previous tag, and
   the repository keeps no CHANGELOG.md for that reason: the notes are a view of what the pull
   requests already say, not a second list to keep true. This module turns that list into a page.

   Housekeeping lines are dropped so the page reads as what changed for a consumer: version bumps,
   and the archiving of a change after it shipped. Everything else stays with its type prefix,
   because `fix:` and `docs:` are information. */

const RELEASES_URL = 'https://api.github.com/repos/yesbert/loomweaver/releases?per_page=100';
const HOUSEKEEPING = [/^chore\(openspec\): archive\b/, /^chore: bump version\b/];
const NOTE_LINE = /^\*\s+(.+?)\s+by @[\w-]+ in (https:\/\/github\.com\/\S+\/pull\/(\d+))\s*$/;

export async function fetchReleases({ token = process.env.GITHUB_TOKEN, fetchImpl = fetch } = {}) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'loomweaver-site' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetchImpl(RELEASES_URL, { headers, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`GitHub answered ${response.status} for the release list`);
  }
  const releases = await response.json();
  return releases
    .filter((release) => !release.draft)
    .map((release) => ({
      tag: release.tag_name,
      date: release.published_at,
      prerelease: Boolean(release.prerelease),
      url: release.html_url,
      body: release.body ?? '',
    }));
}

/* The notes are the generated bullet list; each line names a pull request. Anything that is not
   such a line (the "What's Changed" heading, the compare link) is not a change and is dropped. */
export function changes(body) {
  const out = [];
  for (const raw of body.split(/\r?\n/)) {
    const match = raw.trim().match(NOTE_LINE);
    if (!match) continue;
    const [, title, url, number] = match;
    if (HOUSEKEEPING.some((pattern) => pattern.test(title))) continue;
    out.push({ title, url, number: Number(number) });
  }
  return out;
}

function day(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function renderChangelog(releases) {
  const sorted = [...releases].sort((a, b) => (a.date < b.date ? 1 : -1));
  const lines = [
    '# Changelog',
    '',
    'What each release changed, newest first, read from the GitHub release list when this site was',
    'built. Every line is a pull request that was merged for that release; version bumps and the',
    'archiving of finished changes are left out, so the list is what changed for you. A preview is a',
    'release on the `next` line of the packages; the released line is what `npm install` gives you.',
    '',
  ];
  for (const release of sorted) {
    const marker = release.prerelease ? ' <small>preview</small>' : '';
    lines.push(`## ${release.tag}${marker}`, '', `_${day(release.date)}_`, '');
    const entries = changes(release.body);
    if (entries.length === 0) {
      lines.push('Housekeeping only: nothing a consumer would notice.', '');
    } else {
      for (const entry of entries) lines.push(`- ${entry.title} ([#${entry.number}](${entry.url}))`);
      lines.push('');
    }
    lines.push(`[The release on GitHub](${release.url})`, '');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

export function renderUnavailable(reason) {
  return [
    '# Changelog',
    '',
    'What each release changed, newest first, read from the GitHub release list when this site is',
    'built. This build could not reach GitHub, so the list is not here; the releases themselves are',
    'at [github.com/yesbert/loomweaver/releases](https://github.com/yesbert/loomweaver/releases).',
    '',
    `<!-- ${reason} -->`,
    '',
  ].join('\n');
}

export function newestDate(releases) {
  return releases.reduce((newest, release) => (release.date > newest ? release.date : newest), '');
}
