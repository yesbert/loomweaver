import { ContainerSpec } from '@loomweaver/plugin-sdk';
import { View } from '../../../layout/view';
import {
  childForSegmentPath,
  containerChildIds,
  containerChildOf,
  containerChildPath,
  containerPathOfDock,
  isAddressable,
} from './container-children';

const views = [
  { id: 'app.list', title: 'list' },
  { id: 'app.item', title: 'item' },
  { id: 'app.notes', title: 'notes' },
] as View[];

const spec: ContainerSpec = {
  children: [
    { surface: 'app.list', segment: 'list' },
    { surface: 'app.item', segment: 'item/:itemId' },
    'app.notes',
  ],
};

describe('container children', () => {
  it('reads both declaration forms', () => {
    expect(containerChildIds(spec)).toEqual([
      'app.list',
      'app.item',
      'app.notes',
    ]);
    expect(containerChildOf(spec, 'app.item')?.segment).toBe('item/:itemId');
    expect(containerChildOf(spec, 'app.notes')?.segment).toBeUndefined();
  });

  it('calls a segment addressable only when it needs no value', () => {
    expect(isAddressable('list')).toBe(true);
    expect(isAddressable('item/:itemId')).toBe(false);
    expect(isAddressable(undefined)).toBe(false);
  });

  it('matches a path below the container against the declared segments', () => {
    expect(childForSegmentPath(spec, views, 'list')?.child.id).toBe('app.list');
    expect(childForSegmentPath(spec, views, 'item/e-01')?.child.id).toBe(
      'app.item',
    );
    expect(childForSegmentPath(spec, views, 'nope')).toBeUndefined();
  });

  it('ignores a child that declares no segment — it has no address', () => {
    expect(childForSegmentPath(spec, views, 'app.notes')).toBeUndefined();
  });

  it('builds the tab path from the container path and the segment', () => {
    expect(containerChildPath('browse/alpha', 'item/e-01')).toBe(
      'browse/alpha/item/e-01',
    );
    expect(containerPathOfDock('container@browse/alpha')).toBe('browse/alpha');
  });
});
