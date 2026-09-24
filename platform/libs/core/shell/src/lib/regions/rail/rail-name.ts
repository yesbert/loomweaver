import { LayoutRegion, ShellLayout } from '../../layout/layout';
import { regionsOfType } from '../../layout/layout-queries';

export function railNameKey(rail: LayoutRegion, layout: ShellLayout): string {
  if (regionsOfType(layout, 'rail').length < 2) {
    return 'rail.label';
  }
  return rail.dock === 'right' ? 'rail.labelRight' : 'rail.labelLeft';
}
