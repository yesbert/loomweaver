import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expandPackageManagerFences, resetTabIds, translateLine } from './package-managers.mjs';

test('derives the other three spellings from the npm one', () => {
  assert.equal(translateLine('npx @loomweaver/cli init', 'pnpm'), 'pnpm dlx @loomweaver/cli init');
  assert.equal(translateLine('npx @loomweaver/cli init', 'yarn'), 'yarn dlx @loomweaver/cli init');
  assert.equal(translateLine('npx @loomweaver/cli init', 'bun'), 'bunx @loomweaver/cli init');
  assert.equal(translateLine('npm install @loomweaver/shell @angular/cdk', 'pnpm'), 'pnpm add @loomweaver/shell @angular/cdk');
  assert.equal(translateLine('npm install -D tailwindcss', 'yarn'), 'yarn add -D tailwindcss');
  assert.equal(translateLine('npm install -D tailwindcss', 'bun'), 'bun add -d tailwindcss');
  assert.equal(translateLine('npm start', 'pnpm'), 'pnpm start');
  assert.equal(translateLine('npm run build', 'bun'), 'bun build');
  assert.equal(translateLine('ng new my-studio --style=css', 'bun'), 'ng new my-studio --style=css');
  assert.equal(translateLine('  npx ng serve', 'yarn'), '  yarn dlx ng serve');
  assert.equal(translateLine('# a comment', 'pnpm'), '# a comment');
});

test('turns a "sh npm" fence into a tab group and leaves other fences alone', () => {
  resetTabIds();
  const md = [
    'Before.',
    '',
    '```sh npm',
    'ng new my-studio && cd my-studio',
    'npx @loomweaver/cli init',
    '```',
    '',
    '```bash',
    'npm install left-alone',
    '```',
  ].join('\n');
  const out = expandPackageManagerFences(md);
  assert.match(out, /<div class="lw-pm"><input type="radio" name="pm-1" id="pm-1-npm" class="lw-pm-radio lw-pm-npm" checked>/);
  assert.match(out, /<label for="pm-1-bun" class="lw-pm-tab lw-pm-bun">bun<\/label>/);
  assert.match(out, /<pre class="lw-pm-panel lw-pm-pnpm"><code>ng new my-studio &amp;&amp; cd my-studio\npnpm dlx @loomweaver\/cli init<\/code><\/pre>/);
  assert.match(out, /```bash\nnpm install left-alone\n```/);
  assert.doesNotMatch(out, /```sh npm/);
});

test('escapes what a shell line may carry', () => {
  resetTabIds();
  const out = expandPackageManagerFences('```sh npm\nnpm install a@$(node -p "1<2")\n```');
  assert.match(out, /a@\$\(node -p "1&lt;2"\)/);
});
