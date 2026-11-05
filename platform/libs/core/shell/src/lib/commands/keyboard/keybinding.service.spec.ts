import { TestBed } from '@angular/core/testing';
import { KeybindingService } from './keybinding.service';
import { CommandService } from '../command.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { provideShellFeatures } from '../../foundation/shell-features';
import { RecentCommandsService } from '../palette/recent-commands.service';
import type { MockInstance } from 'vitest';

describe('KeybindingService', () => {
  let keybindings: KeybindingService;
  let commands: CommandService;
  let registry: ContributionRegistry;
  let execute: MockInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(ContributionRegistry);
    commands = TestBed.inject(CommandService);
    keybindings = TestBed.inject(KeybindingService);
    execute = vi.spyOn(commands, 'execute').mockImplementation(() => undefined);
  });

  function press(target: EventTarget, init: KeyboardEventInit): boolean {
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ...init,
    });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }

  it('binds nothing where the distribution switched shortcuts off', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideShellFeatures({ commands: { shortcuts: false } })],
    });
    const bedRegistry = TestBed.inject(ContributionRegistry);
    const bedCommands = TestBed.inject(CommandService);
    const blocked = vi
      .spyOn(bedCommands, 'execute')
      .mockImplementation(() => undefined);
    bedRegistry.addCommand({
      id: 'do.add',
      title: 't',
      shortcut: 'mod+enter',
      run: () => undefined,
    });
    TestBed.inject(KeybindingService).start();

    const prevented = press(document, { key: 'Enter', ctrlKey: true });

    expect(blocked).not.toHaveBeenCalled();
    expect(prevented).toBe(false);
  });

  it('runs the bound command and prevents default on a matching chord', () => {
    registry.addCommand({
      id: 'do.add',
      title: 't',
      shortcut: 'mod+enter',
      run: () => undefined,
    });
    keybindings.start();

    const prevented = press(document, { key: 'Enter', ctrlKey: true });

    expect(execute).toHaveBeenCalledWith('do.add');
    expect(prevented).toBe(true);
  });

  it('ignores a keydown that matches no binding', () => {
    registry.addCommand({
      id: 'do.add',
      title: 't',
      shortcut: 'mod+enter',
      run: () => undefined,
    });
    keybindings.start();

    press(document, { key: 'Enter' });

    expect(execute).not.toHaveBeenCalled();
  });

  it('rebuilds bindings reactively as commands come and go', () => {
    keybindings.start();
    const handle = registry.addCommand({
      id: 'do.a',
      title: 't',
      shortcut: 'a',
      run: () => undefined,
    });

    press(document, { key: 'a' });
    expect(execute).toHaveBeenCalledWith('do.a');

    execute.mockClear();
    handle.dispose();
    press(document, { key: 'a' });
    expect(execute).not.toHaveBeenCalled();
  });

  it('does not hijack a plain chord while typing in a field, but still fires a modifier chord', () => {
    registry.addCommand({
      id: 'do.a',
      title: 't',
      shortcut: 'a',
      run: () => undefined,
    });
    registry.addCommand({
      id: 'do.save',
      title: 't',
      shortcut: 'mod+s',
      run: () => undefined,
    });
    keybindings.start();
    const input = document.createElement('input');
    document.body.append(input);

    press(input, { key: 'a' });
    expect(execute).not.toHaveBeenCalled();

    press(input, { key: 's', ctrlKey: true });
    expect(execute).toHaveBeenCalledWith('do.save');

    input.remove();
  });

  it('runs no command for a key something already handled', () => {
    registry.addCommand({
      id: 'do.save',
      title: 't',
      shortcut: 'mod+s',
      run: () => undefined,
    });
    keybindings.start();
    const grid = document.createElement('div');
    grid.addEventListener('keydown', (event) => event.preventDefault());
    document.body.append(grid);

    press(grid, { key: 's', ctrlKey: true });

    expect(execute).not.toHaveBeenCalled();
    grid.remove();
  });

  it('does not hijack a plain key typed in a field inside a shadow root', () => {
    registry.addCommand({
      id: 'do.a',
      title: 't',
      shortcut: 'a',
      run: () => undefined,
    });
    keybindings.start();
    const host = document.createElement('div');
    const field = document.createElement('input');
    host.attachShadow({ mode: 'open' }).append(field);
    document.body.append(host);

    const prevented = press(field, { key: 'a', composed: true });

    expect(execute).not.toHaveBeenCalled();
    expect(prevented).toBe(false);
    host.remove();
  });

  it('runs no command for a key pressed while a character is being composed', () => {
    registry.addCommand({
      id: 'do.add',
      title: 't',
      shortcut: 'mod+enter',
      run: () => undefined,
    });
    keybindings.start();
    const input = document.createElement('input');
    document.body.append(input);

    const prevented = press(input, { key: 'Enter', ctrlKey: true, isComposing: true });

    expect(execute).not.toHaveBeenCalled();
    expect(prevented).toBe(false);
    input.remove();
  });

  it('lets AltGr type its character in a field where the same keys are a chord', () => {
    registry.addCommand({
      id: 'do.export',
      title: 't',
      shortcut: 'ctrl+alt+e',
      run: () => undefined,
    });
    keybindings.start();
    const input = document.createElement('input');
    document.body.append(input);

    const prevented = press(input, {
      key: '€',
      code: 'KeyE',
      ctrlKey: true,
      altKey: true,
      modifierAltGraph: true,
    });

    expect(execute).not.toHaveBeenCalled();
    expect(prevented).toBe(false);

    press(input, { key: 'e', code: 'KeyE', ctrlKey: true, altKey: true });
    expect(execute).toHaveBeenCalledWith('do.export');
    input.remove();
  });

  describe('a key that types', () => {
    function bound(shortcut: string): HTMLInputElement {
      registry.addCommand({ id: 'do.it', title: 't', shortcut, run: () => undefined });
      keybindings.start();
      const input = document.createElement('input');
      document.body.append(input);
      return input;
    }

    afterEach(() => document.body.replaceChildren());

    it('types "@" with Option+L on a German Mac and runs no chord', () => {
      const input = bound('alt+l');

      const prevented = press(input, { key: '@', code: 'KeyL', altKey: true });

      expect(execute).not.toHaveBeenCalled();
      expect(prevented).toBe(false);
    });

    it('types "@" with Ctrl+Alt+Q on German Windows and runs no chord', () => {
      const input = bound('ctrl+alt+q');

      const prevented = press(input, { key: '@', code: 'KeyQ', ctrlKey: true, altKey: true });

      expect(execute).not.toHaveBeenCalled();
      expect(prevented).toBe(false);
    });

    it('runs Ctrl+Alt+L on a US layout, where the key is its own base key', () => {
      const input = bound('ctrl+alt+l');

      press(input, { key: 'l', code: 'KeyL', ctrlKey: true, altKey: true });

      expect(execute).toHaveBeenCalledWith('do.it');
    });

    it('runs a chord with Ctrl and Shift on a digit, which inserts nothing although the key reads "!"', () => {
      const input = bound('ctrl+shift+1');

      press(input, { key: '!', code: 'Digit1', ctrlKey: true, shiftKey: true });

      expect(execute).toHaveBeenCalledWith('do.it');
    });

    it('leaves a chord outside a field untouched, whatever the layout made of the key', () => {
      bound('alt+l');

      press(document.body, { key: '@', code: 'KeyL', altKey: true });

      expect(execute).toHaveBeenCalledWith('do.it');
    });
  });

  it('warns on a shortcut clash and lets the last command win', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    registry.addCommand({
      id: 'do.first',
      title: 't',
      shortcut: 'mod+k',
      run: () => undefined,
    });
    registry.addCommand({
      id: 'do.second',
      title: 't',
      shortcut: 'mod+k',
      run: () => undefined,
    });
    keybindings.start();

    press(document, { key: 'k', ctrlKey: true });
    TestBed.tick();

    expect(warn).toHaveBeenCalled();
    expect(execute).toHaveBeenCalledWith('do.second');
    warn.mockRestore();
  });

  it('ignores commands without a shortcut', () => {
    registry.addCommand({ id: 'do.plain', title: 't', run: () => undefined });
    keybindings.start();

    press(document, { key: 'Enter' });

    expect(execute).not.toHaveBeenCalled();
  });

  it('attaches the listener only once', () => {
    registry.addCommand({
      id: 'do.add',
      title: 't',
      shortcut: 'mod+enter',
      run: () => undefined,
    });
    keybindings.start();
    keybindings.start();

    press(document, { key: 'Enter', ctrlKey: true });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('leaves the recently-used record alone when a shortcut fires a command', () => {
    execute.mockRestore();
    localStorage.clear();
    const recent = TestBed.inject(RecentCommandsService);
    const run = vi.fn();
    registry.addCommand({
      id: 'do.add',
      title: 'Add',
      shortcut: 'mod+enter',
      run,
    });
    keybindings.start();

    press(document, { key: 'Enter', ctrlKey: true });

    expect(run).toHaveBeenCalledTimes(1);
    expect(recent.ids()).toEqual([]);
    expect(localStorage.getItem('lw.shell.command-mru')).toBeNull();
  });

  describe('on the neutral delete key', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'platform');

    function on(platform: string): void {
      Object.defineProperty(navigator, 'platform', {
        value: platform,
        configurable: true,
      });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      registry = TestBed.inject(ContributionRegistry);
      commands = TestBed.inject(CommandService);
      keybindings = TestBed.inject(KeybindingService);
      execute = vi
        .spyOn(commands, 'execute')
        .mockImplementation(() => undefined);
    }

    afterEach(() => {
      if (original) {
        Object.defineProperty(navigator, 'platform', original);
      }
    });

    it('fires on backspace and not on forward delete on macOS', () => {
      on('MacIntel');
      registry.addCommand({
        id: 'card.remove',
        title: 't',
        shortcut: 'del',
        run: () => undefined,
      });
      keybindings.start();

      press(document, { key: 'Delete' });
      expect(execute).not.toHaveBeenCalled();
      press(document, { key: 'Backspace' });
      expect(execute).toHaveBeenCalledWith('card.remove');
    });

    it('fires on forward delete and not on backspace elsewhere', () => {
      on('Win32');
      registry.addCommand({
        id: 'card.remove',
        title: 't',
        shortcut: 'del',
        run: () => undefined,
      });
      keybindings.start();

      press(document, { key: 'Backspace' });
      expect(execute).not.toHaveBeenCalled();
      press(document, { key: 'Delete' });
      expect(execute).toHaveBeenCalledWith('card.remove');
    });

    it('clashes with backspace on macOS and not elsewhere', () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      for (const [platform, clashes] of [
        ['MacIntel', true],
        ['Win32', false],
      ] as const) {
        on(platform);
        warn.mockClear();
        registry.addCommand({
          id: 'card.remove',
          title: 't',
          shortcut: 'del',
          run: () => undefined,
        });
        registry.addCommand({
          id: 'text.erase',
          title: 't',
          shortcut: 'backspace',
          run: () => undefined,
        });
        keybindings.start();
        TestBed.tick();

        expect(warn.mock.calls.length > 0).toBe(clashes);
      }
      warn.mockRestore();
    });
  });
});
