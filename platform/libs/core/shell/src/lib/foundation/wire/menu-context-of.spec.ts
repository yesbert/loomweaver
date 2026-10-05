import { menuContextOf, requiredMenuContext } from './menu-context-of';

describe('reading a menu description', () => {
  it('keeps the named values and drops anything else when lenient', () => {
    expect(menuContextOf({ a: 'x', b: 2, c: true, d: { nested: 1 }, e: null })).toEqual({
      a: 'x',
      b: 2,
      c: true,
    });
    expect(menuContextOf(['x'])).toBeUndefined();
    expect(menuContextOf('x')).toBeUndefined();
  });

  it('refuses the whole description when strict and anything in it is not a named value', () => {
    expect(requiredMenuContext({ a: 'x', b: 2 }, 'refused')).toEqual({ a: 'x', b: 2 });
    expect(() => requiredMenuContext({ a: { nested: 1 } }, 'refused')).toThrow('refused');
    expect(() => requiredMenuContext(['x'], 'refused')).toThrow('refused');
  });
});
