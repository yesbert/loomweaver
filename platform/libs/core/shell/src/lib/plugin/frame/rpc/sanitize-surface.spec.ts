import { Surface } from '@loomweaver/plugin-sdk';
import { sanitizeRpcSurface } from './sanitize-surface';

function asSurface(raw: unknown): Surface {
  return raw as Surface;
}

function validSurface(overrides: Record<string, unknown> = {}): Surface {
  return asSurface({
    id: 'testbed.view',
    title: 'testbed.title',
    iframe: '/demo/view.html',
    routable: { path: 'a' },
    ...overrides,
  });
}

describe('sanitizeRpcSurface', () => {
  it('accepts the { iframe } surface form with a same-origin URL and rebuilds it field by field', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      asSurface({
        id: 'sandbox-rpc.view',
        title: 'testbed.sandbox.title',
        icon: 'testbedSandbox',
        iframe: '/sandbox-rpc/view.html',
        routable: {
          path: 'sandbox-rpc',
          subRoutes: ['overview', 'architecture'],
        },
        smuggled: () => 'nope',
      }),
    );

    expect(surface).toEqual({
      id: 'sandbox-rpc.view',
      title: 'testbed.sandbox.title',
      icon: 'testbedSandbox',
      order: undefined,
      iframe: '/sandbox-rpc/view.html',
      routable: {
        path: 'sandbox-rpc',
        subRoutes: ['overview', 'architecture'],
        title: undefined,
        titleIsLiteral: undefined,
        icon: undefined,
        chromeless: undefined,
      },
    });
    expect('smuggled' in surface).toBe(false);
  });

  it('keeps chromeless but drops junk-typed fields', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        routable: {
          path: 'sandbox-login',
          chromeless: true,
          subRoutes: ['ok', 42, null],
        },
      }),
    );

    expect(surface.routable?.chromeless).toBe(true);
    expect(surface.routable?.subRoutes).toEqual(['ok']);
  });

  it('carries retain and saveOn through, so the host warning for an inert saveOn can fire', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({ retain: 'always', saveOn: 'hide' }),
    );
    expect(surface.retain).toBe('always');
    expect(surface.saveOn).toBe('hide');

    const junk = sanitizeRpcSurface(
      'testbed',
      validSurface({ retain: 'later', saveOn: 'close' }),
    );
    expect(junk.retain).toBeUndefined();
    expect(junk.saveOn).toBeUndefined();
  });

  it('lets a sandboxed surface ask for an inset and ask to be flush, and refuses anything else', () => {
    expect(
      sanitizeRpcSurface('testbed', validSurface({ padded: true })).padded,
    ).toBe(true);
    expect(
      sanitizeRpcSurface('testbed', validSurface({ padded: false })).padded,
    ).toBe(false);
    expect(
      sanitizeRpcSurface('testbed', validSurface({ padded: 'yes' })).padded,
    ).toBeUndefined();
  });

  it('rejects a missing or empty id', () => {
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ id: undefined })),
    ).toThrow(/'id'/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ id: '' })),
    ).toThrow(/'id'/);
  });

  it('rejects a missing or empty title', () => {
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ title: undefined })),
    ).toThrow(/'title'/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ title: '' })),
    ).toThrow(/'title'/);
  });

  it('rejects a surface that is neither routable nor docked — it has nowhere to go', () => {
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ routable: undefined })),
    ).toThrow(/routable\.path/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ routable: { path: '' } })),
    ).toThrow(/routable\.path/);
  });

  it('accepts a docked surface with no address and carries docks through', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        routable: undefined,
        docks: ['secondary', 42, 'primary'],
        instanceable: true,
      }),
    );

    expect(surface.docks).toEqual(['secondary', 'primary']);
    expect(surface.routable).toBeUndefined();
    expect(surface.instanceable).toBe(true);
  });

  it('accepts a container spec, but only on a routable surface', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        iframe: undefined,
        container: { children: ['a', 7, 'b'], initial: ['a'] },
      }),
    );
    expect(surface.container).toEqual({ children: ['a', 'b'], initial: ['a'] });

    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({
          iframe: undefined,
          routable: undefined,
          docks: ['primary'],
          container: { children: [] },
        }),
      ),
    ).toThrow(/container surface must be routable/);
  });

  it('carries a declared arrangement across the seam, rebuilt node by node', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        iframe: undefined,
        container: {
          children: ['graph', 'monitor'],
          initial: {
            columns: [
              { size: 60, tabs: ['graph'], smuggled: () => 'nope' },
              {
                rows: [
                  {
                    tabs: [
                      { surface: 'monitor', active: true, closable: false },
                    ],
                  },
                  { tabs: [42, { closable: false }] },
                ],
              },
            ],
          },
        },
      }),
    );

    expect(surface.container?.initial).toEqual({
      columns: [
        { size: 60, tabs: ['graph'] },
        {
          rows: [
            { tabs: [{ surface: 'monitor', active: true, closable: false }] },
            { tabs: [] },
          ],
        },
      ],
    });
  });

  it('stops at a bounded depth rather than recursing into what a plugin sends', () => {
    let area: unknown = { tabs: ['graph'] };
    for (let depth = 0; depth < 20; depth += 1) {
      area = { rows: [area] };
    }

    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        iframe: undefined,
        container: { children: ['graph'], initial: area },
      }),
    );

    expect(JSON.stringify(surface.container?.initial)).not.toContain('tabs');
  });

  it('still rejects access — a sandboxed surface gates itself', () => {
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ access: { anyRole: ['admin'] } }),
      ),
    ).toThrow(/'access'/);
  });

  it('rejects the component surface form (and anything without an iframe URL)', () => {
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ iframe: undefined, component: class {} }),
      ),
    ).toThrow(/iframe/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ component: class {} })),
    ).toThrow(/iframe/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ iframe: undefined })),
    ).toThrow(/iframe/);
  });

  it('rejects a foreign-origin, javascript: or data: surface URL', () => {
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ iframe: 'https://evil.example/phish.html' }),
      ),
    ).toThrow(/permitted/);
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ iframe: '//evil.example/phish.html' }),
      ),
    ).toThrow(/permitted/);
    const scriptUrl = 'javascript:alert(1)';
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ iframe: scriptUrl })),
    ).toThrow(/permitted/);
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ iframe: 'data:text/html,<h1>hi</h1>' }),
      ),
    ).toThrow(/permitted/);
  });

  it('accepts a surface from an origin the composition permitted for the plugin', () => {
    const surface = sanitizeRpcSurface(
      'treaties',
      validSurface({ iframe: 'https://treaties.example.com/view.html' }),
      ['https://treaties.example.com'],
    );

    expect(surface.iframe).toBe('https://treaties.example.com/view.html');
  });

  it('still refuses an origin that was not permitted, and the own origin still needs no permit', () => {
    expect(() =>
      sanitizeRpcSurface(
        'treaties',
        validSurface({ iframe: 'https://billing.example.com/view.html' }),
        ['https://treaties.example.com'],
      ),
    ).toThrow(/permitted/);
    expect(
      sanitizeRpcSurface(
        'treaties',
        validSurface({ iframe: '/own/view.html' }),
        ['https://treaties.example.com'],
      ).iframe,
    ).toBe('/own/view.html');
  });

  it('refuses an executing or inline address however many origins were permitted', () => {
    const scriptUrl = 'javascript:alert(1)';
    expect(() =>
      sanitizeRpcSurface('treaties', validSurface({ iframe: scriptUrl }), [
        'https://treaties.example.com',
      ]),
    ).toThrow(/permitted/);
    expect(() =>
      sanitizeRpcSurface(
        'treaties',
        validSurface({ iframe: 'data:text/html,<h1>hi</h1>' }),
        ['https://treaties.example.com'],
      ),
    ).toThrow(/permitted/);
  });

  it('ignores a permitted entry that is not an http(s) origin', () => {
    expect(() =>
      sanitizeRpcSurface(
        'treaties',
        validSurface({ iframe: 'data:text/html,<h1>hi</h1>' }),
        ['data:', 'null', 'not a url'],
      ),
    ).toThrow(/permitted/);
  });
});
