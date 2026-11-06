import { TestBed } from '@angular/core/testing';
import {
  FRAME_PLUGIN_ADDRESSES_KEY,
  FramePluginAddresses,
} from './frame-plugin-addresses';

function routed(path: string) {
  return { id: path, title: path, routable: { path }, iframe: '/view.html' };
}

describe('the addresses a frame plugin answered', () => {
  afterEach(() => localStorage.clear());

  it('keep the latest hundred per plugin, the oldest dropped first', () => {
    const addresses = TestBed.inject(FramePluginAddresses);

    for (let index = 0; index < 105; index += 1) {
      addresses.answered('docs', routed(`page-${index}`));
    }

    const kept = addresses.of('docs');
    expect(kept).toHaveLength(100);
    expect(kept[0]).toBe('page-5');
    expect(kept.at(-1)).toBe('page-104');
  });

  it('are kept only for the plugins named', () => {
    const addresses = TestBed.inject(FramePluginAddresses);
    addresses.answered('docs', routed('docs'));
    addresses.answered('gone', routed('gone'));

    addresses.keepOnly(['docs', 'never-answered']);

    expect(
      JSON.parse(localStorage.getItem(FRAME_PLUGIN_ADDRESSES_KEY) ?? '{}'),
    ).toEqual({ docs: ['docs'] });
  });
});
