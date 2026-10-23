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

describe('a heading that leads to a command', () => {
  const header = {
    title: 'account.name',
    detail: 'account.detail',
    initials: 'AL',
  };
  const words: Record<string, string> = {
    'account.name': 'Ada Lovelace',
    'account.detail': 'ada@testbed.local',
    'account.profile': 'Profile',
  };
  const translate = (key: string) => words[key] ?? key;
  const profile = { title: 'account.profile' };

  it('is named by what it shows, then by the command', () => {
    const heading = drawMenuHeading(header, profile);

    wordMenuHeading(heading, header, translate, profile);

    expect(heading.getAttribute('aria-label')).toBe(
      'AL, Ada Lovelace, ada@testbed.local, Profile',
    );
  });

  it('keeps what it shows apart as words', () => {
    const heading = drawMenuHeading(header, profile);

    wordMenuHeading(heading, header, translate, profile);

    expect(heading.textContent?.replaceAll(/\s+/g, ' ').trim()).toBe(
      'AL Ada Lovelace ada@testbed.local',
    );
  });

  it('leaves out initials a picture stands in for', () => {
    const pictured = { ...header, image: 'https://example.test/ada.png' };
    const heading = drawMenuHeading(pictured, profile);

    wordMenuHeading(heading, pictured, translate, profile);

    expect(heading.getAttribute('aria-label')).toBe(
      'Ada Lovelace, ada@testbed.local, Profile',
    );
  });

  it('names the initials once the picture gives way to them', () => {
    const pictured = { ...header, image: 'https://example.test/ada.png' };
    const heading = drawMenuHeading(pictured, profile);
    wordMenuHeading(heading, pictured, translate, profile);

    heading.querySelector('img')?.dispatchEvent(new Event('error'));

    expect(heading.getAttribute('aria-label')).toBe(
      'AL, Ada Lovelace, ada@testbed.local, Profile',
    );
  });

  it('leaves the text inside an icon mark out of the name', () => {
    const withIcon = { title: 'account.name', icon: 'user' };
    const heading = drawMenuHeading(withIcon, profile);
    heading.querySelector('lw-icon')!.textContent = 'User icon';

    wordMenuHeading(heading, withIcon, translate, profile);

    expect(heading.getAttribute('aria-label')).toBe('Ada Lovelace, Profile');
  });

  it('is named anew in the language it is worded in', () => {
    const heading = drawMenuHeading(header, profile);
    wordMenuHeading(heading, header, translate, profile);

    wordMenuHeading(
      heading,
      header,
      (key) => (key === 'account.profile' ? 'Profil' : translate(key)),
      profile,
    );

    expect(heading.getAttribute('aria-label')).toBe(
      'AL, Ada Lovelace, ada@testbed.local, Profil',
    );
  });
});
