import { LayoutRegion, ShellLayout } from '../../layout/layout';

export function railNameKey(rail: LayoutRegion, layout: ShellLayout): string {
  const rails = layout.regions.filter((region) => region.type === 'rail');
  if (rails.length < 2) {
    return 'rail.label';
  }
  return rail.dock === 'right' ? 'rail.labelRight' : 'rail.labelLeft';
}
