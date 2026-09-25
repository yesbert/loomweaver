import { drawMenuHeading, wordMenuHeading } from './menu-heading';

describe('the heading of a menu', () => {
  it('draws no second line where the detail translates to nothing', () => {
    const header = { title: 'account.title', detail: 'account.detail' };
    const heading = drawMenuHeading(header);

    const label = wordMenuHeading(heading, header, (key) =>
      key === 'account.detail' ? '' : 'Your account',
    );

    const detail = heading.querySelector<HTMLElement>('.lw-menu-header-detail');
    expect(detail?.hidden ?? true).toBe(true);
    expect(label).toBe('Your account');
  });
});
