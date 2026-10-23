import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stillAsNgNewWrote } from './ng-new-files';

const NG_NEW = JSON.parse(
  readFileSync(join(import.meta.dirname, 'ng-new-22.fixture.json'), 'utf8'),
) as Record<string, string>;

const REPLACED = [
  'src/main.ts',
  'src/index.html',
  'src/styles.css',
  'src/app/app.ts',
  'src/app/app.html',
  'src/app/app.config.ts',
  'src/app/app.spec.ts',
];

describe('stillAsNgNewWrote', () => {
  it.each(REPLACED)('recognises %s as ng new wrote it', (path) => {
    expect(stillAsNgNewWrote(path, NG_NEW[path])).toBe(true);
  });

  it('recognises a file a formatter rewrote without changing it', () => {
    const formatted = NG_NEW['src/main.ts']
      .replaceAll("'", '"')
      .replace(
        'bootstrapApplication(App, appConfig)\n  .catch',
        'bootstrapApplication(App, appConfig).catch',
      );
    expect(stillAsNgNewWrote('src/main.ts', formatted)).toBe(true);
  });

  it('recognises an empty global stylesheet', () => {
    expect(stillAsNgNewWrote('src/styles.css', '\n')).toBe(true);
  });

  it.each([
    [
      'src/app/app.config.ts',
      NG_NEW['src/app/app.config.ts'].replace(
        'provideRouter(routes)',
        'provideRouter(routes),\n    provideHttpClient()',
      ),
    ],
    ['src/styles.css', 'body { margin: 0; }\n'],
    ['src/app/app.html', '<h1>Orders</h1>\n<router-outlet />\n'],
    [
      'src/app/app.html',
      `${NG_NEW['src/app/app.html']}\n<footer>Acme</footer>\n`,
    ],
    [
      'src/index.html',
      NG_NEW['src/index.html'].replace(
        '</head>',
        '  <script src="analytics.js"></script>\n</head>',
      ),
    ],
  ])(
    'does not take %s for what ng new wrote once it was changed',
    (path, content) => {
      expect(stillAsNgNewWrote(path, content)).toBe(false);
    },
  );

  it('recognises nothing it does not know', () => {
    expect(stillAsNgNewWrote('ngsw-config.json', '{}')).toBe(false);
  });
});
