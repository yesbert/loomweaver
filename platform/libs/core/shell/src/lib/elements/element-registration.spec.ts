import * as entry from '../../index';
import { LW_ELEMENT_DEFINITIONS } from './lw-elements';

describe('registering the workbench elements outside the workbench', () => {
  it.each(LW_ELEMENT_DEFINITIONS.map((define) => [define.name, define]))(
    'publishes %s from the package entry',
    (name, define) => {
      expect((entry as Record<string, unknown>)[name]).toBe(define);
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
