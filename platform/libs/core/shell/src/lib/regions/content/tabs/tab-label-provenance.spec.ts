import { ContentRoute } from '@loomweaver/plugin-sdk';
import { toOpenTab, toPaneTab } from './content-tab-projection';

describe('where a tab label comes from', () => {
  const home: ContentRoute = {
    path: '',
    title: 'home.title',
    icon: 'home',
    component: class {},
  } as unknown as ContentRoute;

  const payments: ContentRoute = {
    path: 'payments',
    title: 'payments.title',
    icon: 'payments',
    component: class {},
  } as unknown as ContentRoute;

  it('does not borrow the home label for an address the home does not answer', () => {
    const tab = toOpenTab([home], { path: 'payments', closable: false }, undefined);

    expect(tab.title).toBe('payments');
    expect(tab.literalTitle).toBe(true);
    expect(tab.icon).toBeUndefined();
  });

  it('labels the address from its own declaration once that has registered', () => {
    const tab = toOpenTab(
      [home, payments],
      { path: 'payments', closable: false },
      undefined,
    );

    expect(tab.title).toBe('payments.title');
    expect(tab.icon).toBe('payments');
  });

  it('still labels the bare address from the surface that answers it', () => {
    const tab = toOpenTab([home], { path: '', closable: false }, undefined);

    expect(tab.title).toBe('home.title');
    expect(tab.icon).toBe('home');
  });

  it('stores no label for a tab whose label it worked out', () => {
    const derived = toOpenTab(
      [home, payments],
      { path: 'payments', closable: false },
      undefined,
    );

    const stored = toPaneTab(derived);

    expect(stored.title).toBeUndefined();
    expect(stored.icon).toBeUndefined();
    expect(stored.path).toBe('payments');
    expect(stored.closable).toBe(false);
  });

  it('stores the label a tab carries, so a refined title survives a restart', () => {
    const carried = toOpenTab(
      [home, payments],
      { path: 'payments', title: 'Invoice 4711', literalTitle: true },
      undefined,
    );

    const stored = toPaneTab(carried);

    expect(carried.title).toBe('Invoice 4711');
    expect(stored.title).toBe('Invoice 4711');
    expect(stored.literalTitle).toBe(true);
  });
});
