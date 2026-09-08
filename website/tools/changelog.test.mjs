import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changes, fetchReleases, newestDate, renderChangelog } from './changelog.mjs';

const body = [
  "## What's Changed",
  '* docs(openspec): the tutorial snapshot is a tag of its own by @yesbert in https://github.com/yesbert/loomweaver/pull/300',
  '* fix(devkit): the scaffold sets the bundle budget it makes necessary by @yesbert in https://github.com/yesbert/loomweaver/pull/301',
  '* chore(openspec): archive the scaffold budget change by @yesbert in https://github.com/yesbert/loomweaver/pull/302',
  '* chore: bump version to 0.9.2 by @yesbert in https://github.com/yesbert/loomweaver/pull/305',
  '',
  '**Full Changelog**: https://github.com/yesbert/loomweaver/compare/v0.9.1...v0.9.2',
].join('\n');

test('keeps the pull requests a consumer would notice and drops housekeeping', () => {
  const kept = changes(body);
  assert.deepEqual(
    kept.map((entry) => entry.number),
    [300, 301],
  );
  assert.equal(kept[1].title, 'fix(devkit): the scaffold sets the bundle budget it makes necessary');
  assert.equal(kept[1].url, 'https://github.com/yesbert/loomweaver/pull/301');
});

test('renders newest first, marks a preview, and says when nothing is left', () => {
  const page = renderChangelog([
    { tag: 'v0.9.1', date: '2026-09-07T18:22:52Z', prerelease: false, url: 'https://x/v0.9.1', body: '* chore: bump version to 0.9.1 by @yesbert in https://github.com/yesbert/loomweaver/pull/1' },
    { tag: 'v0.9.2', date: '2026-09-07T19:53:59Z', prerelease: false, url: 'https://x/v0.9.2', body },
    { tag: 'v0.9.0-preview.10', date: '2026-09-07T08:53:07Z', prerelease: true, url: 'https://x/p10', body: '' },
  ]);
  const headings = page.split('\n').filter((line) => line.startsWith('## '));
  assert.deepEqual(headings, ['## v0.9.2', '## v0.9.1', '## v0.9.0-preview.10 <small>preview</small>']);
  assert.match(page, /^# Changelog\n\nWhat each release changed/);
  assert.match(page, /- fix\(devkit\): the scaffold sets the bundle budget it makes necessary \(\[#301\]/);
  assert.match(page, /## v0\.9\.1\n\n_7 September 2026_\n\nHousekeeping only/);
  assert.doesNotMatch(page, /Full Changelog/);
});

test('the newest date is the page date', () => {
  assert.equal(
    newestDate([{ date: '2026-09-06T00:00:00Z' }, { date: '2026-09-07T19:53:59Z' }, { date: '2026-09-07T14:54:19Z' }]),
    '2026-09-07T19:53:59Z',
  );
});

test('fetching sends the token when there is one and refuses a bad answer', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      json: async () => [
        { tag_name: 'v1', published_at: '2026-01-01T00:00:00Z', prerelease: false, html_url: 'u', body: null, draft: false },
        { tag_name: 'v2', published_at: '2026-01-02T00:00:00Z', prerelease: true, html_url: 'v', body: 'x', draft: true },
      ],
    };
  };
  const releases = await fetchReleases({ token: 't0k', fetchImpl });
  assert.equal(calls[0].init.headers.authorization, 'Bearer t0k');
  assert.deepEqual(releases, [{ tag: 'v1', date: '2026-01-01T00:00:00Z', prerelease: false, url: 'u', body: '' }]);
  await assert.rejects(fetchReleases({ token: '', fetchImpl: async () => ({ ok: false, status: 403 }) }), /403/);
});
