import { TestBed } from '@angular/core/testing';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
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

  it('are pruned once a store that answers later has answered', async () => {
    let answer: (raw: string) => void = () => undefined;
    const set = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WORKING_STATE_STORE,
          useValue: {
            get: () => new Promise<string>((resolve) => (answer = resolve)),
            set,
            delete: () => Promise.resolve(),
          },
        },
      ],
    });
    const addresses = TestBed.inject(FramePluginAddresses);

    addresses.keepOnly(['docs']);
    answer(JSON.stringify({ docs: ['docs'], gone: ['gone'] }));

    await vi.waitFor(() => expect(addresses.read()).toBe(true));
    expect(addresses.of('gone')).toEqual([]);
    expect(set).toHaveBeenLastCalledWith(
      FRAME_PLUGIN_ADDRESSES_KEY,
      JSON.stringify({ docs: ['docs'] }),
    );
  });
});

