import { TestBed } from '@angular/core/testing';
import { DialogService } from '../dialog/dialog.service';
import { PluginStoreDialog } from './plugin-store-dialog';
import { PluginStoreService } from './plugin-store.service';

describe('PluginStoreService', () => {
  it('opens the store dialog from code without a catalogue composed', () => {
    const open = vi.fn(() => ({ closed: Promise.resolve(undefined) }));
    TestBed.configureTestingModule({
      providers: [{ provide: DialogService, useValue: { open } }],
    });

    TestBed.inject(PluginStoreService).open();

    expect(open).toHaveBeenCalledWith(
      PluginStoreDialog,
      expect.objectContaining({ title: 'settings.pluginStore', bare: true }),
    );
  });

  it('opens with the title the catalogue configured', () => {
    const open = vi.fn(() => ({ closed: Promise.resolve(undefined) }));
    TestBed.configureTestingModule({
      providers: [{ provide: DialogService, useValue: { open } }],
    });
    const store = TestBed.inject(PluginStoreService);
    store.configure('Extensions');

    store.open();

    expect(open).toHaveBeenCalledWith(
      PluginStoreDialog,
      expect.objectContaining({ title: 'Extensions' }),
    );
  });
});
