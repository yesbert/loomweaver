import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as entry from '../../index';

const PROVIDE_SHELL_FROM_WORKSPACE_ROOT =
  'libs/core/shell/src/lib/provide-shell.ts';

function registrationsTheWorkbenchRunsOnStart(): string[] {
  const file = join(process.cwd(), PROVIDE_SHELL_FROM_WORKSPACE_ROOT);
  if (!existsSync(file)) {
    throw new Error(
      `Expected ${PROVIDE_SHELL_FROM_WORKSPACE_ROOT} under the workspace root (${process.cwd()}).`,
    );
  }
  const source = readFileSync(file, 'utf8');
  return [...new Set(source.match(/defineLw\w+(?=\(\))/g))];
}

describe('registering the workbench elements outside the workbench', () => {
  it('finds the registrations the workbench runs on start', () => {
    expect(registrationsTheWorkbenchRunsOnStart()).toContain('defineLwIcon');
  });

  it.each(registrationsTheWorkbenchRunsOnStart())(
    'publishes %s from the package entry',
    (name) => {
      expect(typeof (entry as Record<string, unknown>)[name]).toBe('function');
    },
  );

  it('draws a select registered from the package entry', () => {
    const register = (entry as Record<string, unknown>)['defineLwSelect'];
    expect(typeof register).toBe('function');
    (register as () => void)();

    const host = document.createElement('div');
    host.innerHTML =
      '<lw-select label="Severity"><lw-option value="low">Low</lw-option></lw-select>';
    document.body.append(host);

    expect(host.querySelector('lw-select')?.matches(':defined')).toBe(true);
    expect(host.querySelector('lw-option')?.matches(':defined')).toBe(true);
    host.remove();
  });
});
