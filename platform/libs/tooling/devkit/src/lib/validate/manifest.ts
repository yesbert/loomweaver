import { isKebabId } from '../generate/casing';
import { Finding } from './types';

export const KNOWN_CAPABILITIES: readonly string[] = [
  'contributions',
  'ui',
  'host',
  'navigation',
  'session',
  'theme',
  'automation',
];

export interface ManifestLike {
  readonly id?: unknown;
  readonly name?: unknown;
  readonly capabilities?: unknown;
}

export function validateManifest(
  manifest: ManifestLike,
  known: readonly string[] = KNOWN_CAPABILITIES,
): Finding[] {
  const findings: Finding[] = [];

  if (typeof manifest.id !== 'string' || !isKebabId(manifest.id)) {
    findings.push({
      level: 'error',
      code: 'manifest.id',
      message: `Plugin id must be a kebab-case string; got ${JSON.stringify(manifest.id)}.`,
      path: 'manifest.id',
    });
  }

  if (manifest.name !== undefined && typeof manifest.name !== 'string') {
    findings.push({
      level: 'error',
      code: 'manifest.name',
      message: 'Plugin name must be a string when provided.',
      path: 'manifest.name',
    });
  }

  findings.push(...validateCapabilities(manifest.capabilities, known));
  return findings;
}

function validateCapabilities(capabilities: unknown, known: readonly string[]): Finding[] {
  if (capabilities === undefined) {
    return [];
  }
  if (!Array.isArray(capabilities)) {
    return [
      {
        level: 'error',
        code: 'manifest.capabilities',
        message: 'capabilities must be an array when provided.',
        path: 'manifest.capabilities',
      },
    ];
  }

  const findings: Finding[] = [];
  const seen = new Set<string>();
  for (const capability of capabilities) {
    if (typeof capability !== 'string' || !known.includes(capability)) {
      findings.push({
        level: 'error',
        code: 'manifest.capability.unknown',
        message: `Unknown capability ${JSON.stringify(capability)}. Known: ${known.join(', ')}.`,
        path: 'manifest.capabilities',
      });
      continue;
    }
    if (seen.has(capability)) {
      findings.push({
        level: 'warning',
        code: 'manifest.capability.duplicate',
        message: `Duplicate capability "${capability}".`,
        path: 'manifest.capabilities',
      });
    }
    seen.add(capability);
  }
  return findings;
}
