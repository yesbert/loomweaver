import { VIEW, View, provideViews } from './view';

class DummyView {}

describe('provideViews', () => {
  it('hooks each view as a multi-provider for VIEW', () => {
    const nav: View = {
      id: 'nav',
      region: 'left',
      title: 'nav.title',
      component: DummyView,
    };
    const info: View = {
      id: 'info',
      region: 'left',
      title: 'info.title',
      order: 5,
      component: DummyView,
    };

    expect(provideViews(nav, info)).toEqual([
      { provide: VIEW, useValue: nav, multi: true },
      { provide: VIEW, useValue: info, multi: true },
    ]);
  });
});
