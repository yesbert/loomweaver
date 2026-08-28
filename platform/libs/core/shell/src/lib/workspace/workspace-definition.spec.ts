import { PRIMARY_PANE } from '../regions/pane/tree/pane-address';
import { PaneLeaf, PaneNode } from '../regions/pane/tree/pane-node';
import { findLeaf, paneSegments } from '../regions/pane/tree/pane-queries';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import {
  WorkspaceBaselineDeps,
  WorkspaceDefinition,
  auditWorkspaceDefinitions,
  declaredTabPaths,
  workspaceBaseline,
} from './workspace-definition';

const DEPS: WorkspaceBaselineDeps = {
  panelRegions: ['primary', 'secondary'],
  declaredPaths: (region) =>
    region === 'primary' ? ['view:nav', 'view:outline', 'view:list'] : [],
};

function treeOf(definition: WorkspaceDefinition): PaneNode {
  const raw = workspaceBaseline(definition, DEPS).trees;
  expect(raw).toBeDefined();
  const parsed = JSON.parse(raw as string) as Record<string, PaneNode>;
  return parsed[CONTENT_DOCK];
}

describe('workspaceBaseline', () => {
  it('builds the recursive column/row arrangement with proportional fractions', () => {
    const tree = treeOf({
      id: 'ws',
      title: 'k.ws',
      content: {
        columns: [
          { size: 25, tabs: ['list'] },
          {
            size: 45,
            rows: [{ tabs: ['a'] }, { tabs: ['b'] }, { tabs: ['c'] }],
          },
          { rows: [{ size: 70, tabs: ['d'] }, { tabs: ['e'] }] },
        ],
      },
    });

    const fractions = new Map(
      paneSegments(tree).map((segment) => [segment.path, segment.fraction]),
    );
    expect(fractions.get('list')).toBeCloseTo(0.25, 5);
    expect(fractions.get('a')).toBeCloseTo(0.15, 5);
    expect(fractions.get('b')).toBeCloseTo(0.15, 5);
    expect(fractions.get('c')).toBeCloseTo(0.15, 5);
    expect(fractions.get('d')).toBeCloseTo(0.21, 5);
    expect(fractions.get('e')).toBeCloseTo(0.09, 5);
  });

  it('makes the first tabs area the primary pane', () => {
    const tree = treeOf({
      id: 'ws',
      title: 'k.ws',
      content: {
        columns: [
          { tabs: [{ path: 'list', closable: false }] },
          { tabs: ['a', { path: 'b', active: true }] },
        ],
      },
    });

    const primary = findLeaf(tree, PRIMARY_PANE) as PaneLeaf;
    expect(primary.tabs).toEqual([{ path: 'list', closable: false }]);
    expect(primary.active).toBe('list');

    const secondary = paneSegments(tree).find(
      (segment) => segment.id !== PRIMARY_PANE,
    );
    const leaf = findLeaf(tree, secondary?.id ?? '') as PaneLeaf;
    expect(leaf.tabs).toEqual([{ path: 'a' }, { path: 'b' }]);
    expect(leaf.active).toBe('b');
  });

  it('shares the remainder evenly among unsized siblings and normalizes oversized sums', () => {
    const even = treeOf({
      id: 'ws',
      title: 'k.ws',
      content: {
        columns: [{ size: 50, tabs: ['a'] }, { tabs: ['b'] }, { tabs: ['c'] }],
      },
    });
    const evenFractions = new Map(
      paneSegments(even).map((segment) => [segment.path, segment.fraction]),
    );
    expect(evenFractions.get('a')).toBeCloseTo(0.5, 5);
    expect(evenFractions.get('b')).toBeCloseTo(0.25, 5);
    expect(evenFractions.get('c')).toBeCloseTo(0.25, 5);

    const oversized = treeOf({
      id: 'ws',
      title: 'k.ws',
      content: {
        columns: [
          { size: 150, tabs: ['a'] },
          { size: 50, tabs: ['b'] },
        ],
      },
    });
    const oversizedFractions = new Map(
      paneSegments(oversized).map((segment) => [
        segment.path,
        segment.fraction,
      ]),
    );
    expect(oversizedFractions.get('a')).toBeCloseTo(0.75, 5);
    expect(oversizedFractions.get('b')).toBeCloseTo(0.25, 5);
  });

  it('hides the unnamed views of a listed region and leaves unlisted regions alone', () => {
    const state = workspaceBaseline(
      {
        id: 'ws',
        title: 'k.ws',
        sidebars: { primary: ['nav'] },
      },
      DEPS,
    );

    expect(JSON.parse(state.hiddenViews as string)).toEqual([
      'list',
      'outline',
    ]);
    expect(state.trees).toBeUndefined();
  });

  it('hides every view of a region listed with an empty array', () => {
    const state = workspaceBaseline(
      { id: 'ws', title: 'k.ws', sidebars: { primary: [] } },
      DEPS,
    );

    expect(JSON.parse(state.hiddenViews as string)).toEqual([
      'list',
      'nav',
      'outline',
    ]);
  });

  it('is deterministic across calls', () => {
    const definition: WorkspaceDefinition = {
      id: 'ws',
      title: 'k.ws',
      sidebars: { primary: ['nav'] },
      content: {
        rows: [
          { tabs: ['a'] },
          { columns: [{ tabs: ['b'] }, { tabs: ['c'] }] },
        ],
      },
    };
    expect(workspaceBaseline(definition, DEPS)).toEqual(
      workspaceBaseline(definition, DEPS),
    );
  });

  it('ignores an invalid content declaration and drops view tabs with a named problem', () => {
    const state = workspaceBaseline(
      { id: 'ws', title: 'k.ws', content: { tabs: ['view:nav'] } },
      DEPS,
    );
    expect(state.trees).toBeUndefined();

    const kept = treeOf({
      id: 'ws',
      title: 'k.ws',
      content: { tabs: ['a', 'view:nav'] },
    });
    expect(paneSegments(kept).map((segment) => segment.path)).toEqual(['a']);
  });
});

describe('auditWorkspaceDefinitions', () => {
  const regions = ['primary', 'secondary'];

  it('names duplicate ids, the reserved default id and unknown regions', () => {
    const problems = auditWorkspaceDefinitions(
      [
        { id: 'default', title: 'k' },
        { id: 'ws', title: 'k' },
        { id: 'ws', title: 'k' },
        { id: 'other', title: 'k', sidebars: { nope: [] } },
      ],
      regions,
    );
    expect(problems.some((p) => p.includes('"default"'))).toBe(true);
    expect(problems.some((p) => p.includes('declared twice'))).toBe(true);
    expect(problems.some((p) => p.includes('"nope"'))).toBe(true);
  });

  it('names structural content problems with their consequence', () => {
    const problems = auditWorkspaceDefinitions(
      [
        { id: 'ws', title: 'k', content: { tabs: [] } },
        {
          id: 'ws2',
          title: 'k',
          content: {
            columns: [
              { size: -1, tabs: ['a'] },
              {
                tabs: [
                  { path: 'b', active: true },
                  { path: 'c', active: true },
                ],
              },
            ],
          },
        },
      ],
      regions,
    );
    expect(problems.some((p) => p.includes('has no tabs'))).toBe(true);
    expect(problems.some((p) => p.includes('empty layout'))).toBe(true);
    expect(problems.some((p) => p.includes('positive percentage'))).toBe(true);
    expect(problems.some((p) => p.includes('the first wins'))).toBe(true);
  });
});

describe('declaredTabPaths', () => {
  it('collects every declared tab path across the arrangement', () => {
    expect(
      declaredTabPaths({
        id: 'ws',
        title: 'k.ws',
        content: {
          columns: [
            { tabs: ['a'] },
            { rows: [{ tabs: ['b'] }, { tabs: ['c'] }] },
          ],
        },
      }),
    ).toEqual(['a', 'b', 'c']);
  });

  it('names the second declaration that claims to be initial, since it is ignored', () => {
    const problems = auditWorkspaceDefinitions(
      [
        { id: 'first', title: 'F', initial: true },
        { id: 'second', title: 'S', initial: true },
      ],
      ['primary'],
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('"second"');
    expect(problems[0]).toContain('"first"');
  });
});
