import DOMPurify from 'dompurify';
import { LOOM_ICONS } from './loom-icons';

const icons = new Map<string, string>(Object.entries(LOOM_ICONS));
const distribution = new Map<string, string>();

export function resolveIcon(name: string): string | undefined {
  return icons.get(name);
}

export function hasIcon(name: string): boolean {
  return icons.has(name);
}

export function sanitizeIconSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}

export function setIcon(name: string, svg: string): void {
  icons.set(name, svg);
}

export function setDistributionIcon(name: string, svg: string): void {
  distribution.set(name, svg);
  icons.set(name, svg);
}

export function distributionIcons(): Readonly<Record<string, string>> {
  return Object.fromEntries(distribution);
}

export function removeIcon(name: string): void {
  icons.delete(name);
}
