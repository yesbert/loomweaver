import { Methods } from 'penpal';
import { distributionIcons } from '../../../elements/icon/icon-registry';
import { LW_TOKENS } from '../../../theme/theme-tokens';
import { isAtOrBelow, normalizePath } from '../content-path';
import type { LwSurfaceCaptureRequest } from '../../../surface-kit/surface-kit.frame';

export interface SurfaceState {
  readonly locale: string;
  readonly tab: string;
  readonly theme: 'light' | 'dark';
  readonly preview: boolean;
  readonly shown: boolean;
  readonly tokens: Record<string, string>;
  readonly rootFontSize: string;
  readonly icons?: Record<string, string>;
  readonly instanceId?: string;
  readonly params?: Record<string, string>;
  readonly rest?: string;
  readonly session?: {
    readonly authenticated: boolean;
    readonly roles: readonly string[];
  };
}

export type SurfaceRemote = Methods & {
  render(state: SurfaceState): Promise<void>;
  beforeClose(): Promise<boolean> | boolean;
  stateChanged(key: string, value: unknown, loaded: boolean): void;
  capture(request: LwSurfaceCaptureRequest): Promise<unknown>;
};

export function resolvedLook(
  document: Document,
): Pick<SurfaceState, 'tokens' | 'rootFontSize' | 'icons'> {
  const styles = getComputedStyle(document.documentElement);
  const tokens: Record<string, string> = {};
  for (const name of LW_TOKENS) {
    tokens[name] = styles.getPropertyValue(name).trim();
  }
  const icons = distributionIcons();
  return {
    tokens,
    rootFontSize: styles.fontSize,
    ...(Object.keys(icons).length > 0 && { icons }),
  };
}

export function confinedTarget(tabRoot: string, path: string): string {
  const target = normalizePath(path);
  if (!isAtOrBelow(tabRoot, target)) {
    throw new Error(
      `Surface navigation is confined to its own tab root "${tabRoot}" — got "${target}". ` +
        `Use the plugin (logic) channel's ctx.navigateContent for anything else ('navigation' grant).`,
    );
  }
  return target;
}
