import {
  heroAdjustmentsHorizontal,
  heroArrowRightStartOnRectangle,
  heroMagnifyingGlassCircle,
  heroPower,
  heroSquares2x2,
  heroUser,
  heroUserCircle,
} from '@ng-icons/heroicons/outline';
import {
  heroArrowLeftStartOnRectangleSolid,
  heroMagnifyingGlassSolid,
  heroSparklesSolid,
  heroSquares2x2Solid,
  heroUserCircleSolid,
} from '@ng-icons/heroicons/solid';

export type LookId = 'default' | 'aurora' | 'breeze';

export interface DemoLook {
  readonly id: LookId;
  readonly label: string;
  readonly icons: Readonly<Record<string, string>>;
  readonly overrides: string | null;
}

export const LOOKS: readonly DemoLook[] = [
  {
    id: 'default',
    label: 'Standard',
    icons: {
      account: heroUserCircle,
      signOut: heroArrowRightStartOnRectangle,
    },
    overrides: null,
  },
  {
    id: 'aurora',
    label: 'Aurora',
    icons: {
      account: heroUser,
      signOut: heroPower,
      workspaces: heroSquares2x2,
      settings: heroAdjustmentsHorizontal,
      search: heroMagnifyingGlassCircle,
    },
    overrides: '/i18n/overrides/aurora',
  },
  {
    id: 'breeze',
    label: 'Breeze',
    icons: {
      account: heroUserCircleSolid,
      signOut: heroArrowLeftStartOnRectangleSolid,
      workspaces: heroSquares2x2Solid,
      settings: heroSparklesSolid,
      search: heroMagnifyingGlassSolid,
    },
    overrides: '/i18n/overrides/breeze',
  },
];

export const DEFAULT_LOOK = LOOKS[0];

export function lookById(id: string): DemoLook {
  return LOOKS.find((look) => look.id === id) ?? DEFAULT_LOOK;
}
