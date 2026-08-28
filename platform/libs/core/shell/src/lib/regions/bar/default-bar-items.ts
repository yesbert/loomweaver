import { BarItem } from '../../foundation/bar-item';
import { ShellBrand } from './shell-brand';
import { LanguageSwitcher } from '../../i18n/language-switcher';
import { ThemeToggle } from '../../theme/theme-toggle';
import { LwVersion } from '../../version/lw-version';
import { UpdateBadge } from '../../update/update-badge';

export const DEFAULT_BAR_ITEMS: readonly BarItem[] = [
  {
    id: 'shell.brand',
    bar: 'top-bar',
    slot: 'start',
    order: 0,
    component: ShellBrand,
  },
  {
    id: 'shell.update',
    bar: 'top-bar',
    slot: 'end',
    order: 7,
    component: UpdateBadge,
  },
  {
    id: 'shell.language',
    bar: 'top-bar',
    slot: 'end',
    order: 10,
    component: LanguageSwitcher,
  },
  {
    id: 'shell.theme',
    bar: 'top-bar',
    slot: 'end',
    order: 20,
    component: ThemeToggle,
  },
  {
    id: 'shell.version',
    bar: 'status-bar',
    slot: 'end',
    order: 100,
    component: LwVersion,
  },
];
