import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoConfig, TranslocoService } from '@jsverse/transloco';
import { ShellMissingTranslationHandler } from './missing-translation-handler';

const CONFIG = { missingHandler: { logMissingKey: true } } as TranslocoConfig;

function handlerOver(translation: Record<string, string>) {
  const transloco = {
    getActiveLang: () => 'en',
    getTranslation: () => translation,
  };
  TestBed.configureTestingModule({
    providers: [
      ShellMissingTranslationHandler,
      { provide: TranslocoService, useValue: transloco },
    ],
  });
  return TestBed.inject(ShellMissingTranslationHandler);
}

describe('ShellMissingTranslationHandler', () => {
  it('stays quiet while no bundle has loaded — nothing is missing yet', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(handlerOver({}).handle('plugin.view.title', CONFIG)).toBe(
      'plugin.view.title',
    );

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns like Transloco once a bundle is loaded', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    handlerOver({ 'shell.ok': 'OK' }).handle('plugin.view.title', CONFIG);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Missing translation for 'plugin.view.title'"),
      expect.any(String),
    );
    warn.mockRestore();
  });

  describe('a literal, which is not a key', () => {
    it.each(['DE', 'Deutsch', 'Norbert Rosenwinkel', 'n@example.com', 'Save as.'])(
      'stays silent about %s after a bundle has loaded, and shows it as it is',
      (literal) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        expect(handlerOver({ 'shell.ok': 'OK' }).handle(literal, CONFIG)).toBe(
          literal,
        );

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
      },
    );

    it('still reports a dotted key the bundle lacks', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      handlerOver({ 'shell.ok': 'OK' }).handle('notes.list.titel', CONFIG);

      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });

    it('reports a literal that has the shape of a key, since nothing tells them apart', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      handlerOver({ 'shell.ok': 'OK' }).handle('1.2.3', CONFIG);

      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });
  });

  it('honours the config switch and resolves the service lazily', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handler = handlerOver({ 'shell.ok': 'OK' });
    const silent = {
      missingHandler: { logMissingKey: false },
    } as TranslocoConfig;

    expect(handler.handle('plugin.view.title', silent)).toBe(
      'plugin.view.title',
    );

    expect(warn).not.toHaveBeenCalled();
    expect(TestBed.inject(Injector)).toBeTruthy();
    warn.mockRestore();
  });
});
