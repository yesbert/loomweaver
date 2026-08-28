import { settingOmitIds } from './setting-omit';

describe('settingOmitIds', () => {
  it('picks only setting:-prefixed ids and strips the prefix', () => {
    expect(
      settingOmitIds(['setting:shell.textSize', 'setting:shell.permissions']),
    ).toEqual(['shell.textSize', 'shell.permissions']);
  });

  it('ignores chrome ids, so omitting a bar item never touches the matching settings row', () => {
    expect(
      settingOmitIds([
        'shell.language',
        'shell.theme',
        'menu:shell.tab.closeAll',
      ]),
    ).toEqual([]);
  });

  it('is empty for an empty omit list', () => {
    expect(settingOmitIds([])).toEqual([]);
  });
});
