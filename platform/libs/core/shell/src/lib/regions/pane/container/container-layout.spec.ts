import { ContainerSpec } from '@loomweaver/plugin-sdk';
import { containerLayout } from './container-layout';
import { PRIMARY_PANE, VIEW_PANE_PREFIX } from '../tree/pane-address';
import { PaneLeaf, PaneSplit } from '../tree/pane-node';

const DOCK = 'container@runs/abc';

function build(spec: ContainerSpec) {
  const problems: string[] = [];
  const tree = containerLayout(DOCK, spec, problems, 'Surface "runs.detail"');
  return { ...tree, problems };
}

describe('containerLayout', () => {
  it('treats the plain list as shorthand for one tabs area', () => {
    const { node } = build({
      children: ['graph', 'monitor'],
      initial: ['graph', 'monitor'],
    });

    const leaf = node as PaneLeaf;
    expect(leaf.kind).toBe('leaf');
    expect(leaf.id).toBe(PRIMARY_PANE);
    expect(leaf.tabs.map((tab) => tab.path)).toEqual([
      `${VIEW_PANE_PREFIX}graph`,
      `${VIEW_PANE_PREFIX}monitor`,
    ]);
    expect(leaf.tabs[0].instance).toBe(`${DOCK}::graph`);
    expect(leaf.active).toBe(`${VIEW_PANE_PREFIX}graph`);
  });

  it('builds the declared arrangement, sizes and all', () => {
    const { node } = build({
      children: ['graph', 'cockpit', 'monitor'],
      initial: {
        columns: [
          { size: 60, tabs: ['graph'] },
          {
            size: 40,
            rows: [
              { size: 70, tabs: ['cockpit'] },
              { size: 30, tabs: ['monitor'] },
            ],
          },
        ],
      },
    });

    const root = node as PaneSplit;
    expect(root.kind).toBe('split');
    expect(root.orientation).toBe('row');
    expect(root.ratio).toBeCloseTo(0.6, 5);
    expect((root.first as PaneLeaf).id).toBe(PRIMARY_PANE);
    const right = root.second as PaneSplit;
    expect(right.orientation).toBe('column');
    expect(right.ratio).toBeCloseTo(0.7, 5);
    expect((right.first as PaneLeaf).tabs[0].path).toBe(
      `${VIEW_PANE_PREFIX}cockpit`,
    );
    expect((right.second as PaneLeaf).tabs[0].path).toBe(
      `${VIEW_PANE_PREFIX}monitor`,
    );
  });

  it('honours active and closable on a declared tab', () => {
    const { node } = build({
      children: ['graph', 'cockpit'],
      initial: {
        tabs: ['graph', { surface: 'cockpit', active: true, closable: false }],
      },
    });

    const leaf = node as PaneLeaf;
    expect(leaf.active).toBe(`${VIEW_PANE_PREFIX}cockpit`);
    expect(leaf.tabs[1].closable).toBe(false);
    expect(leaf.tabs[0].closable).toBeUndefined();
  });

  it('drops a child the container does not offer and says so', () => {
    const { node, problems } = build({
      children: ['graph'],
      initial: { tabs: ['graph', 'monitor'] },
    });

    expect((node as PaneLeaf).tabs.map((tab) => tab.path)).toEqual([
      `${VIEW_PANE_PREFIX}graph`,
    ]);
    expect(problems.some((p) => p.includes('not listed in children'))).toBe(
      true,
    );
  });

  it('drops an entry that is neither an id nor a { surface }', () => {
    const { problems } = build({
      children: ['graph'],
      initial: { tabs: ['graph', { closable: false } as never] },
    });

    expect(problems.some((p) => p.includes('must be a child surface id'))).toBe(
      true,
    );
  });

  it('stops rather than recursing into a runaway declaration', () => {
    let area: unknown = { tabs: ['graph'] };
    for (let depth = 0; depth < 12; depth += 1) {
      area = { rows: [area] };
    }

    const { node, problems } = build({
      children: ['graph'],
      initial: area as ContainerSpec['initial'],
    });

    expect(node).toBeNull();
    expect(problems.some((p) => p.includes('nests deeper than'))).toBe(true);
  });

  it('declares nothing when initial is absent', () => {
    expect(build({ children: ['graph'] }).node).toBeNull();
  });
});

describe('containerLayout — addressable children', () => {
  const spec: ContainerSpec = {
    children: [
      { surface: 'list', segment: 'list' },
      { surface: 'item', segment: 'item/:itemId' },
      'graph',
    ],
    initial: {
      columns: [
        { size: 30, tabs: [{ surface: 'list', closable: false }] },
        { size: 70, tabs: [] },
      ],
    },
  };

  it('addresses a segmented child by its path below the container', () => {
    const { node } = build(spec);
    const first = (node as PaneSplit).first as PaneLeaf;
    expect(first.tabs[0].path).toBe('runs/abc/list');
    expect(first.tabs[0].instance).toBe(`${DOCK}::runs/abc/list`);
  });

  it('keeps a pane declared with no tabs, so opened children have somewhere to land', () => {
    const { node, problems } = build(spec);
    const second = (node as PaneSplit).second as PaneLeaf;
    expect(second.tabs).toEqual([]);
    expect(second.declared).toBe(true);
    expect(problems).toEqual([]);
  });

  it('refuses to seed a child whose segment carries a value, and says why', () => {
    const { problems } = build({ ...spec, initial: ['item'] });
    expect(
      problems.some((p) => p.includes('carries a') && p.includes('sibling')),
    ).toBe(true);
  });

  it('still keeps the id form for a child that declares no segment', () => {
    const { node } = build({ ...spec, initial: ['graph'] });
    expect((node as PaneLeaf).tabs[0].path).toBe(`${VIEW_PANE_PREFIX}graph`);
  });
});
