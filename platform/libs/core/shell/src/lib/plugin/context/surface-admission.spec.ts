import { CapabilityError } from '@loomweaver/plugin-sdk';
import { DummyComponent, makeContext } from './host-context-harness';

describe('admitting a surface', () => {
  it('carries a rest declaration into the registered route', () => {
    const { ctx, registry } = makeContext();

    ctx.registerSurface({
      id: 'programs',
      title: 'programs.title',
      routable: { path: 'cedents/:id/programs', rest: true },
      component: DummyComponent,
    });

    expect(registry.contentRoutes()[0].rest).toBe(true);
  });

  it('demands "navigation" for a prefix short enough to own the address space', () => {
    const { ctx, registry } = makeContext(['contributions']);

    expect(() =>
      ctx.registerSurface({
        id: 'programs',
        title: 'programs.title',
        routable: { path: 'cedents', rest: true },
        component: DummyComponent,
      }),
    ).toThrow(CapabilityError);
    expect(registry.contentRoutes()).toHaveLength(0);
  });

  it('leaves a narrow prefix and a rest-less short one ungated', () => {
    const { ctx, registry } = makeContext(['contributions']);

    ctx.registerSurface({
      id: 'pricing',
      title: 'pricing.title',
      routable: { path: 'cedents/:id', rest: true },
      component: DummyComponent,
    });
    ctx.registerSurface({
      id: 'search',
      title: 'search.title',
      routable: { path: 'search' },
      component: DummyComponent,
    });

    expect(registry.contentRoutes()).toHaveLength(2);
  });

  it('refuses one following surface whose parameter name means something else', () => {
    const { ctx, registry } = makeContext();
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    ctx.registerSurface({
      id: 'notes',
      title: 'notes.title',
      routable: {
        path: 'cedents/:cedentId/notes/:id',
        follows: true,
      },
      component: DummyComponent,
    });
    ctx.registerSurface({
      id: 'tasks',
      title: 'tasks.title',
      routable: {
        path: 'cedents/:cedentId/tasks/:id',
        follows: true,
      },
      component: DummyComponent,
    });

    expect(registry.contentRoutes().map((route) => route.id)).toEqual([
      'notes',
    ]);
    expect(error).toHaveBeenCalledWith(expect.stringContaining(':id'));
    error.mockRestore();
  });

  it('leaves surfaces that share a name under the same prefix alone', () => {
    const { ctx, registry } = makeContext();

    for (const facet of ['pricing', 'treaties']) {
      ctx.registerSurface({
        id: facet,
        title: `${facet}.title`,
        routable: {
          path: `cedents/:cedentId/programs/:programId/${facet}`,
          follows: true,
        },
        component: DummyComponent,
      });
    }

    expect(registry.contentRoutes()).toHaveLength(2);
  });

  it('does not police a parameter name that is not following', () => {
    const { ctx, registry } = makeContext();

    ctx.registerSurface({
      id: 'ask',
      title: 'ask.title',
      routable: { path: 'ask/:id' },
      component: DummyComponent,
    });
    ctx.registerSurface({
      id: 'doc',
      title: 'doc.title',
      routable: { path: 'doc/:id' },
      component: DummyComponent,
    });

    expect(registry.contentRoutes()).toHaveLength(2);
  });
});
