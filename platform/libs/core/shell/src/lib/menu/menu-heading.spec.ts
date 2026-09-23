import { drawMenuHeading } from './menu-heading';

describe('the heading of a menu', () => {
  it('draws no second line where the detail translates to nothing', () => {
    const menu = document.createElement('div');

    const heading = drawMenuHeading(
      { title: 'account.title', detail: 'account.detail' },
      menu,
      (key) => (key === 'account.detail' ? '' : 'Your account'),
    );

    const detail = heading.querySelector<HTMLElement>('.lw-menu-header-detail');
    expect(detail?.hidden ?? true).toBe(true);
    expect(menu.getAttribute('aria-label')).toBe('Your account');
  });
});
