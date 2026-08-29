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

  it('re-renders when the source attribute changes', () => {
    const element = document.createElement(LW_MARKDOWN_TAG);
    element.setAttribute('source', '*one*');
    document.body.append(element);
    element.setAttribute('source', '*two*');
    expect(element.querySelector('.prose')?.innerHTML).toContain('<em>two</em>');
  });
});
