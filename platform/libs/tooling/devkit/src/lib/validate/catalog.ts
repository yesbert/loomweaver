import { Finding } from './types';
import { KNOWN_CAPABILITIES } from './manifest';

/**
 * The keys the host reads off a catalog entry. Anything else is never looked at, which is
 * why a misspelled key is the one mistake a catalog cannot report on its own.
 */
export const CATALOG_ENTRY_KEYS: readonly string[] = [
  'id',
  'name',
  'entryUrl',
  'capabilities',
  'version',
  'iconUrl',
  'description',
  'icon',
  'category',
  'author',
  'downloads',
  'updated',
  'repository',
  'readmeUrl',
];

const SAME_ORIGIN_FIELDS = ['entryUrl', 'iconUrl', 'readmeUrl'] as const;

function pathOf(index: number, field?: string): string {
  return field ? `catalog[${index}].${field}` : `catalog[${index}]`;
}

function isPlainObject(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

function requiredUrlFinding(
  value: unknown,
  index: number,
  field: string,
): Finding | undefined {
  if (typeof value !== 'string' || value.length === 0) {
    return {
      level: 'error',
      code: 'catalog.entryUrl',
      message: `${pathOf(index, field)} must be a non-empty string; the host drops the whole entry without it.`,
      path: pathOf(index, field),
    };
  }
  return schemeFinding(value, index, field, 'drops the entry');
}

function optionalUrlFinding(
  value: unknown,
  index: number,
  field: string,
): Finding | undefined {
  if (typeof value !== 'string' || value.length === 0) {
    return {
      level: 'warning',
      code: 'catalog.url.empty',
      message: `${pathOf(index, field)} is present but not a non-empty string, so the host ignores it.`,
      path: pathOf(index, field),
    };
  }
  return schemeFinding(value, index, field, 'ignores the field');
}

function schemeFinding(
  value: string,
  index: number,
  field: string,
  refusal: string,
): Finding | undefined {
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1]?.toLowerCase();
  if (scheme && scheme !== 'http' && scheme !== 'https') {
    return {
      level: 'error',
      code: 'catalog.url.scheme',
      message: `${pathOf(index, field)} uses the "${scheme}:" scheme. The host accepts same-origin http(s) URLs only and ${refusal}.`,
      path: pathOf(index, field),
    };
  }
  if (scheme) {
    return {
      level: 'warning',
      code: 'catalog.url.absolute',
      message: `${pathOf(index, field)} is absolute. The host requires same-origin, so this holds only while it matches the origin the app is served from; a root-relative path is same-origin by construction.`,
      path: pathOf(index, field),
    };
  }
  return undefined;
}

function validateCapabilities(
  value: unknown,
  index: number,
  known: readonly string[],
): Finding[] {
  if (value === undefined) {
    return [
      {
        level: 'warning',
        code: 'catalog.capabilities.missing',
        message: `${pathOf(index)} declares no capabilities. Accepting the install dialog grants exactly what is declared, so the plugin will be denied everything at runtime.`,
        path: pathOf(index, 'capabilities'),
      },
    ];
  }
  if (!Array.isArray(value)) {
    return [
      {
        level: 'error',
        code: 'catalog.capabilities',
        message: `${pathOf(index, 'capabilities')} must be an array; the host ignores any other shape and grants nothing.`,
        path: pathOf(index, 'capabilities'),
      },
    ];
  }
  const findings: Finding[] = [];
  for (const capability of value) {
    if (typeof capability !== 'string' || !known.includes(capability)) {
      findings.push({
        level: 'error',
        code: 'catalog.capability.unknown',
        message: `${pathOf(index, 'capabilities')} contains ${JSON.stringify(capability)}, which the host filters out silently — the plugin then throws CapabilityError at runtime. Known: ${known.join(', ')}.`,
        path: pathOf(index, 'capabilities'),
      });
    }
  }
  return findings;
}

function validateEntry(
  raw: unknown,
  index: number,
  known: readonly string[],
): Finding[] {
  if (!isPlainObject(raw)) {
    return [
      {
        level: 'error',
        code: 'catalog.entry',
        message: `${pathOf(index)} is not an object, so the host drops it.`,
        path: pathOf(index),
      },
    ];
  }

  return [
    ...validateId(raw, index),
    ...validateSameOriginUrls(raw, index),
    ...validateNameAndVersion(raw, index),
    ...validateCapabilities(raw['capabilities'], index, known),
    ...validateEntryMetadata(raw, index),
    ...validateEntryKeys(raw, index),
  ];
}

function validateId(raw: Record<string, unknown>, index: number): Finding[] {
  return typeof raw['id'] === 'string' && raw['id'].length > 0
    ? []
    : [
        {
          level: 'error',
          code: 'catalog.id',
          message: `${pathOf(index, 'id')} must be a non-empty string; the host drops the whole entry without it.`,
          path: pathOf(index, 'id'),
        },
      ];
}

function validateSameOriginUrls(
  raw: Record<string, unknown>,
  index: number,
): Finding[] {
  const findings: Finding[] = [];
  for (const field of SAME_ORIGIN_FIELDS) {
    const finding = sameOriginUrlFinding(raw, index, field);
    if (finding) {
      findings.push(finding);
    }
  }
  return findings;
}

function sameOriginUrlFinding(
  raw: Record<string, unknown>,
  index: number,
  field: (typeof SAME_ORIGIN_FIELDS)[number],
): Finding | undefined {
  if (field === 'entryUrl') {
    return requiredUrlFinding(raw[field], index, field);
  }
  return raw[field] === undefined
    ? undefined
    : optionalUrlFinding(raw[field], index, field);
}

function validateNameAndVersion(
  raw: Record<string, unknown>,
  index: number,
): Finding[] {
  const findings: Finding[] = [];

  if (raw['name'] === undefined) {
    findings.push({
      level: 'warning',
      code: 'catalog.name.missing',
      message: `${pathOf(index)} has no name, so the store falls back to showing the id.`,
      path: pathOf(index, 'name'),
    });
  } else if (typeof raw['name'] !== 'string' || raw['name'].length === 0) {
    findings.push({
      level: 'warning',
      code: 'catalog.name',
      message: `${pathOf(index, 'name')} is not a non-empty string, so the store falls back to showing the id.`,
      path: pathOf(index, 'name'),
    });
  }

  if (raw['version'] === undefined) {
    findings.push({
      level: 'warning',
      code: 'catalog.version.missing',
      message: `${pathOf(index)} carries no version. Update detection compares catalog versions, so the store can never offer an update and republishing the plugin will not respawn it for anyone who already installed it.`,
      path: pathOf(index, 'version'),
    });
  }

  return findings;
}

function validateEntryMetadata(
  raw: Record<string, unknown>,
  index: number,
): Finding[] {
  const findings: Finding[] = [];

  if (
    raw['downloads'] !== undefined &&
    (typeof raw['downloads'] !== 'number' || raw['downloads'] < 0)
  ) {
    findings.push({
      level: 'warning',
      code: 'catalog.downloads',
      message: `${pathOf(index, 'downloads')} must be a non-negative number, so the host ignores it.`,
      path: pathOf(index, 'downloads'),
    });
  }

  if (raw['updated'] !== undefined && !isRenderableDate(raw['updated'])) {
    findings.push({
      level: 'warning',
      code: 'catalog.updated',
      message: `${pathOf(index, 'updated')} is not a date the store can parse, so it renders the raw string instead of "2 days ago".`,
      path: pathOf(index, 'updated'),
    });
  }

  if (raw['repository'] !== undefined && !isHttpUrl(raw['repository'])) {
    findings.push({
      level: 'warning',
      code: 'catalog.repository',
      message: `${pathOf(index, 'repository')} must be an http(s) URL, so the host drops it and the detail pane shows no link.`,
      path: pathOf(index, 'repository'),
    });
  }

  return findings;
}

function validateEntryKeys(
  raw: Record<string, unknown>,
  index: number,
): Finding[] {
  const findings: Finding[] = [];

  for (const key of Object.keys(raw)) {
    if (!CATALOG_ENTRY_KEYS.includes(key)) {
      findings.push({
        level: 'warning',
        code: 'catalog.unknown-key',
        message: `${pathOf(index, key)} is not one of the fields the host reads (${CATALOG_ENTRY_KEYS.join(', ')}), so it is ignored without a word — which is exactly what a misspelled field looks like.`,
        path: pathOf(index, key),
      });
    }
  }

  return findings;
}

function isHttpUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') {
    return false;
  }
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isRenderableDate(raw: unknown): boolean {
  return typeof raw === 'string' && !Number.isNaN(new Date(raw).getTime());
}

/**
 * Checks a plugin store catalog against what the host actually does with it. The host
 * parses catalogs **defensively**: a bad field is dropped and a bad entry disappears, both without a
 * word — so every finding here names the consequence rather than the rule.
 *
 * @param catalog the parsed catalog JSON — an array of entries
 * @param known the capability vocabulary to check against, defaulting to the platform's
 */
export function validateCatalog(
  catalog: unknown,
  known: readonly string[] = KNOWN_CAPABILITIES,
): Finding[] {
  if (!Array.isArray(catalog)) {
    return [
      {
        level: 'error',
        code: 'catalog.shape',
        message: 'A plugin catalog must be a JSON array of entries; the host loads nothing otherwise.',
        path: 'catalog',
      },
    ];
  }

  const findings: Finding[] = [];
  const seen = new Set<string>();
  for (const [index, entry] of catalog.entries()) {
    findings.push(...validateEntry(entry, index, known));
    const id: unknown = isPlainObject(entry) ? entry['id'] : undefined;
    if (typeof id === 'string' && id.length > 0) {
      if (seen.has(id)) {
        findings.push({
          level: 'warning',
          code: 'catalog.id.duplicate',
          message: `${pathOf(index, 'id')} repeats "${id}". The host keeps the first entry with an id and drops the rest.`,
          path: pathOf(index, 'id'),
        });
      }
      seen.add(id);
    }
  }
  return findings;
}
