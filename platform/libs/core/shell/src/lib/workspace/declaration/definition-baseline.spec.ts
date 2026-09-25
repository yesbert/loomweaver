import { PRIMARY_PANE } from '../../regions/pane/tree/pane-address';
import {
  leafPath,
  PaneLeaf,
  PaneNode,
} from '../../regions/pane/tree/pane-node';
import { findLeaf, paneSegments } from '../../regions/pane/tree/pane-queries';
import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { WorkspaceDefinition } from './workspace-definition';
import {
  PanelDeclarations,
  baselineHiddenViews,
  baselineTrees,
  definitionBaseline,
} from './definition-baseline';

const PANELS: PanelDeclarations = {
  panelRegions: ['primary', 'secondary'],
  declaredPaths: (region) =>
    region === 'primary' ? ['view:nav', 'view:outline', 'view:list'] : [],
};

function fractionsByPath(
  node: PaneNode,
  share = 1,
): Map<string | undefined, number> {
  if (node.kind === 'leaf') {
    return new Map([[leafPath(node), share]]);
  }
  return new Map([
    ...fractionsByPath(node.first, share * node.ratio),
    ...fractionsByPath(node.second, share * (1 - node.ratio)),
  ]);
}

function treeOf(definition: WorkspaceDefinition): PaneNode {
  const raw = baselineTrees(definition);
  expect(raw).toBeDefined();
  const parsed = JSON.parse(raw as string) as Record<string, PaneNode>;
  return parsed[CONTENT_DOCK];
}

describe('a definition baseline', () => {
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

    const fractions = fractionsByPath(tree);
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
    const evenFractions = fractionsByPath(even);
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
    const oversizedFractions = fractionsByPath(oversized);
    expect(oversizedFractions.get('a')).toBeCloseTo(0.75, 5);
    expect(oversizedFractions.get('b')).toBeCloseTo(0.25, 5);
  });

  it('hides the unnamed views of a listed region and leaves unlisted regions alone', () => {
    const definition = {
      id: 'ws',
      title: 'k.ws',
      sidebars: { primary: ['nav'] },
    };

    expect(
      JSON.parse(baselineHiddenViews(definition, PANELS) as string),
    ).toEqual(['list', 'outline']);
    expect(baselineTrees(definition)).toBeUndefined();
  });

  it('hides every view of a region listed with an empty array', () => {
    const hidden = baselineHiddenViews(
      { id: 'ws', title: 'k.ws', sidebars: { primary: [] } },
      PANELS,
    );

    expect(JSON.parse(hidden as string)).toEqual(['list', 'nav', 'outline']);
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
    expect(definitionBaseline(definition, PANELS)).toEqual(
      definitionBaseline(definition, PANELS),
    );
  });

  it('ignores an invalid content declaration and drops view tabs with a named problem', () => {
    expect(
      baselineTrees({
        id: 'ws',
        title: 'k.ws',
        content: { tabs: ['view:nav'] },
      }),
    ).toBeUndefined();

    const kept = treeOf({
      id: 'ws',
      title: 'k.ws',
      content: { tabs: ['a', 'view:nav'] },
    });
    expect(paneSegments(kept).map((segment) => segment.path)).toEqual(['a']);
  });
});
