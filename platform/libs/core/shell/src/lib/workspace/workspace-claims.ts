import { segmentsOf } from '../regions/content/content-path';

export interface WorkspaceClaim {
  readonly workspaceId: string;
  readonly pattern: string;
}

export function claimShape(pattern: string): string {
  return segmentsOf(pattern)
    .map((segment) => (segment.startsWith(':') ? ':' : segment))
    .join('/');
}

export function claimMatches(pattern: string, path: string): boolean {
  const parts = segmentsOf(pattern);
  const segments = segmentsOf(path);
  if (parts.length === 0) {
    return segments.length === 0;
  }
  return (
    parts.length <= segments.length &&
    parts.every(
      (part, index) => part.startsWith(':') || part === segments[index],
    )
  );
}

function narrowness(pattern: string): readonly [number, number] {
  const parts = segmentsOf(pattern);
  const literals = parts.filter((part) => !part.startsWith(':')).length;
  return [parts.length, literals];
}

function narrower(a: string, b: string): number {
  const [aLength, aLiterals] = narrowness(a);
  const [bLength, bLiterals] = narrowness(b);
  return aLength === bLength ? aLiterals - bLiterals : aLength - bLength;
}

export function claimFor(
  claims: readonly WorkspaceClaim[],
  path: string,
): WorkspaceClaim | null {
  const matching = claims.filter((claim) => claimMatches(claim.pattern, path));
  if (matching.length === 0) {
    return null;
  }
  let best = matching[0];
  for (const claim of matching) {
    if (narrower(claim.pattern, best.pattern) > 0) {
      best = claim;
    }
  }
  const tied = matching.filter(
    (claim) =>
      claim.workspaceId !== best.workspaceId &&
      narrower(claim.pattern, best.pattern) === 0,
  );
  return tied.length === 0 ? best : null;
}

function contestedShapes(
  claims: readonly WorkspaceClaim[],
): Map<string, readonly string[]> {
  const byShape = new Map<string, string[]>();
  for (const claim of claims) {
    const shape = claimShape(claim.pattern);
    const owners = byShape.get(shape) ?? [];
    if (!owners.includes(claim.workspaceId)) {
      owners.push(claim.workspaceId);
    }
    byShape.set(shape, owners);
  }
  return new Map(
    [...byShape].filter(([, owners]) => owners.length > 1),
  );
}

export function conflictingClaims(
  claims: readonly WorkspaceClaim[],
): readonly string[] {
  return [...contestedShapes(claims)].map(([shape, owners]) => {
    const named = owners.map((id) => `"${id}"`).join(' and ');
    return (
      `Workspaces ${named} both claim "${shape}" — ` +
      `neither is narrower than the other, so the claim is dropped and that address ` +
      `behaves as though nothing claimed it. Give the address one home.`
    );
  });
}

export function withoutConflicts(
  claims: readonly WorkspaceClaim[],
): readonly WorkspaceClaim[] {
  const contested = contestedShapes(claims);
  return claims.filter((claim) => !contested.has(claimShape(claim.pattern)));
}

export function settlementFor(
  claims: readonly WorkspaceClaim[],
  here: readonly WorkspaceClaim[],
  activeId: string,
  path: string,
): string | null {
  if (here.some((claim) => claimMatches(claim.pattern, path))) {
    return null;
  }
  const destination = claimFor(claims, path)?.workspaceId ?? null;
  return destination === activeId ? null : destination;
}
