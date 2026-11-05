import { barMenuContext } from './bar-context';

describe('the description a bar entry’s menu is opened against', () => {
  it('names the entry’s region, as a rail entry’s does, beside the bar it has always named', () => {
    expect(
      barMenuContext({
        id: 'account',
        bar: 'top-bar',
        slot: 'end',
        icon: 'add',
        menu: 'acme/account',
      }),
    ).toEqual({
      targetKind: 'bar-item',
      id: 'account',
      region: 'top-bar',
      bar: 'top-bar',
    });
  });
});
