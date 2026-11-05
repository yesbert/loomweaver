import {
  isPopoutUrl,
  popoutTargetFromUrl,
  popoutUrlFor,
} from './popout-path';

describe('popout paths', () => {
  it('recognises a pop-out url, with or without trailing parts', () => {
    expect(isPopoutUrl('/popout')).toBe(true);
    expect(isPopoutUrl('/popout/')).toBe(true);
    expect(isPopoutUrl('/popout/doc/main')).toBe(true);
    expect(isPopoutUrl('/popout/view/testbed.outline?x=1')).toBe(true);
  });

  it('does not mistake a route that merely starts with the same letters', () => {
    expect(isPopoutUrl('/')).toBe(false);
    expect(isPopoutUrl('/popouts')).toBe(false);
    expect(isPopoutUrl('/doc/popout')).toBe(false);
  });

  it('maps a view url to the view pane descriptor', () => {
    expect(popoutTargetFromUrl('/popout/view/testbed.outline')).toBe(
      'view:testbed.outline',
    );
  });

  it('maps a routable url to its content path, sub-routes included', () => {
    expect(popoutTargetFromUrl('/popout/doc/main')).toBe('doc/main');
    expect(popoutTargetFromUrl('/popout/doc/main/code')).toBe('doc/main/code');
  });

  it('ignores query and hash', () => {
    expect(popoutTargetFromUrl('/popout/doc/main?a=1#x')).toBe('doc/main');
  });

  it('maps the bare prefix to the home target', () => {
    expect(popoutTargetFromUrl('/popout')).toBe('');
    expect(popoutTargetFromUrl('/popout/')).toBe('');
  });

  it('returns null for a url that is not a pop-out', () => {
    expect(popoutTargetFromUrl('/doc/main')).toBeNull();
  });

  it('round-trips both target shapes', () => {
    for (const target of ['view:testbed.outline', 'doc/main', '']) {
      expect(popoutTargetFromUrl(popoutUrlFor(target))).toBe(target);
    }
  });

  it('round-trips a content address that begins like a view address', () => {
    for (const target of ['view/123', 'view', 'view/a/b', '-/view/123', '-']) {
      expect(popoutTargetFromUrl(popoutUrlFor(target))).toBe(target);
    }
  });

  it('keeps a view and a content address apart where both name the same words', () => {
    expect(popoutUrlFor('view/123')).not.toBe(popoutUrlFor('view:123'));
    expect(popoutTargetFromUrl(popoutUrlFor('view:123'))).toBe('view:123');
  });

  it('still opens the view an address written before names', () => {
    expect(popoutTargetFromUrl('/popout/view/123')).toBe('view:123');
    expect(popoutUrlFor('view:testbed.outline')).toBe(
      '/popout/view/testbed.outline',
    );
  });

  it('builds urls the browser can open', () => {
    expect(popoutUrlFor('view:testbed.outline')).toBe(
      '/popout/view/testbed.outline',
    );
    expect(popoutUrlFor('doc/main')).toBe('/popout/doc/main');
    expect(popoutUrlFor('')).toBe('/popout');
  });
});
