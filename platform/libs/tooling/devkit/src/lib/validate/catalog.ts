import { Finding } from './types';
import { isHttpUrl, pathOf, validateSameOriginUrls } from './catalog-urls';
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
  'level',
  'deployed',
];

function isPlainObject(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
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

const TEXT_FIELDS: readonly { readonly field: string; readonly loss: string }[] = [
  { field: 'description', loss: 'the store shows no description' },
  { field: 'icon', loss: 'the install dialog shows the default icon' },
  { field: 'category', loss: 'the entry carries no category badge and the search cannot match one' },
  { field: 'author', loss: 'the store names no author' },
  {
    field: 'version',
    loss: 'update detection has nothing to compare, so the store can never offer an update',
  },
];

function validateTextFields(
  raw: Record<string, unknown>,
  index: number,
): Finding[] {
  return TEXT_FIELDS.filter(
    ({ field }) =>
      raw[field] !== undefined &&
      (typeof raw[field] !== 'string' || raw[field] === ''),
  ).map(({ field, loss }) => ({
    level: 'warning',
    code: 'catalog.text',
    message: `${pathOf(index, field)} is not a non-empty string, so the host drops it and ${loss}.`,
    path: pathOf(index, field),
  }));
}

function validateEntryMetadata(
  raw: Record<string, unknown>,
  index: number,
): Finding[] {
  const findings: Finding[] = [...validateTextFields(raw, index)];

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

  if (
    raw['updated'] !== undefined &&
    (typeof raw['updated'] !== 'string' || raw['updated'] === '')
  ) {
    findings.push({
      level: 'warning',
      code: 'catalog.updated',
      message: `${pathOf(index, 'updated')} is not a non-empty string, so the host drops it and the store shows no date.`,
      path: pathOf(index, 'updated'),
    });
  } else if (raw['updated'] !== undefined && !isRenderableDate(raw['updated'])) {
    findings.push({
      level: 'warning',
      code: 'catalog.updated',
      message: `${pathOf(index, 'updated')} is not a date the store can parse, so it renders the raw string instead of "2 days ago".`,
      path: pathOf(index, 'updated'),
    });
  }

  findings.push(...validatePlacement(raw, index));

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

function validatePlacement(
  raw: Record<string, unknown>,
  index: number,
): Finding[] {
  const findings: Finding[] = [];
  if (raw['deployed'] !== undefined && typeof raw['deployed'] !== 'boolean') {
    findings.push({
      level: 'warning',
      code: 'catalog.deployed',
      message: `${pathOf(index, 'deployed')} must be true or false. The host deploys an entry only when it is exactly true, so this one is merely offered.`,
      path: pathOf(index, 'deployed'),
    });
  }
  if (
    raw['level'] !== undefined &&
    raw['level'] !== 'embedded' &&
    raw['level'] !== 'isolated'
  ) {
    findings.push({
      level: 'warning',
      code: 'catalog.level',
      message: `${pathOf(index, 'level')} must be "embedded" or "isolated". The host ignores anything else and runs the plugin at the level the distribution chooses.`,
      path: pathOf(index, 'level'),
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

function dropsEntry(findings: readonly Finding[], index: number): boolean {
  const fatal = new Set([pathOf(index), pathOf(index, 'id'), pathOf(index, 'entryUrl')]);
  return findings.some(
    (finding) => finding.level === 'error' && finding.path !== undefined && fatal.has(finding.path),
  );
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
  const seen = new Map<string, number>();
  for (const [index, entry] of catalog.entries()) {
    const own = validateEntry(entry, index, known);
    findings.push(...own);
    if (!isPlainObject(entry) || dropsEntry(own, index)) {
      continue;
    }
    const id = entry['id'] as string;
    const first = seen.get(id);
    if (first === undefined) {
      seen.set(id, index);
    } else {
      findings.push({
        level: 'warning',
        code: 'catalog.id.duplicate',
        message: `${pathOf(index, 'id')} repeats "${id}" from ${pathOf(first)}. The host keeps the first usable entry with an id and drops this one.`,
        path: pathOf(index, 'id'),
      });
    }
  }
  return findings;
}
