import { PaneNode } from './pane-node';

export const DEFAULT_RATIO = 0.5;

export const MIN_RATIO = 0.15;

export const MAX_RATIO = 0.85;

const SANITY_MIN = 0.02;

const SANITY_MAX = 0.98;

export function clampRatio(ratio: number): number {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
}

export function sanitizeRatio(ratio: number): number {
  return Math.min(SANITY_MAX, Math.max(SANITY_MIN, ratio));
}

export function withRatio(
  node: PaneNode,
  splitId: string,
  ratio: number,
): PaneNode {
  if (node.kind === 'leaf') {
    return node;
  }
  if (node.id === splitId) {
    return { ...node, ratio };
  }
  return {
    ...node,
    first: withRatio(node.first, splitId, ratio),
    second: withRatio(node.second, splitId, ratio),
  };
}
