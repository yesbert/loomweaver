const ANY = '«any»';

const MAIN_TS = `
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
`;

const APP_CONFIG_TS = `
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
`;

const APP_TS = `
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('${ANY}');
}
`;

const APP_SPEC_TS = `
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, ${ANY}');
  });
});
`;

const INDEX_HTML = `
<!doctype html>
<html lang="${ANY}">
<head>
  <meta charset="utf-8">
  <title>${ANY}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`;

const STYLES_CSS = `
/* You can add global styles to this file, and also import other style files */
`;

const PLACEHOLDER_OPENS = 'The content below';
const PLACEHOLDER_CLOSES = 'The content above';
const COMMENT_END = '-->';
const ROUTER_OUTLET = '<router-outlet/>';

const RECOGNISED: Readonly<Record<string, (content: string) => boolean>> = {
  'src/main.ts': shapedLike(MAIN_TS),
  'src/app/app.config.ts': shapedLike(APP_CONFIG_TS),
  'src/app/app.ts': shapedLike(APP_TS),
  'src/app/app.spec.ts': shapedLike(APP_SPEC_TS),
  'src/index.html': shapedLike(INDEX_HTML),
  'src/styles.css': (content) =>
    canonical(content) === '' || shapedLike(STYLES_CSS)(content),
  'src/app/app.html': placeholderTemplate,
};

export function stillAsNgNewWrote(path: string, content: string): boolean {
  return RECOGNISED[path]?.(content) ?? false;
}

function shapedLike(template: string): (content: string) => boolean {
  const pattern = escapeRegExp(canonical(template)).replaceAll(
    escapeRegExp(ANY),
    "[^'<>]*",
  );
  const form = new RegExp(`^${pattern}$`);
  return (content) => form.test(canonical(content));
}

function placeholderTemplate(content: string): boolean {
  const opens = content.indexOf(PLACEHOLDER_OPENS);
  const closes = content.lastIndexOf(PLACEHOLDER_CLOSES);
  const lastComment = content.lastIndexOf(COMMENT_END);
  return (
    opens !== -1 &&
    closes > opens &&
    lastComment > closes &&
    canonical(content.slice(lastComment + COMMENT_END.length)) === ROUTER_OUTLET
  );
}

function canonical(text: string): string {
  return text
    .replaceAll('"', "'")
    .replaceAll(/\s+/g, '')
    .replaceAll(';', '')
    .replaceAll(/,(?=[)\]}])/g, '');
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
