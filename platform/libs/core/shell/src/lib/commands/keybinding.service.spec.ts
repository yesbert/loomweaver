import { TestBed } from '@angular/core/testing';
import { KeybindingService } from './keybinding.service';
import { CommandService } from './command.service';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { provideShellFeatures } from '../foundation/shell-features';
import { PaletteMruService } from './palette-mru.service';
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
    execute = vi
      .spyOn(commands, 'execute')
      .mockImplementation(() => undefined);
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

  it('warns on a shortcut clash and lets the last command win', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
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
    const mru = TestBed.inject(PaletteMruService);
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
    expect(mru.ids()).toEqual([]);
    expect(localStorage.getItem('lw.shell.command-mru')).toBeNull();
  });
});
