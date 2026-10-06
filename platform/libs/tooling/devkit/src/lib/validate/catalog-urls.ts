import { Finding } from './types';

const SAME_ORIGIN_FIELDS = ['entryUrl', 'iconUrl', 'readmeUrl'] as const;


export function pathOf(index: number, field?: string): string {
  return field ? `catalog[${index}].${field}` : `catalog[${index}]`;
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
  if (value.startsWith('//')) {
    return {
      level: 'error',
      code: 'catalog.url.foreign',
      message: `${pathOf(index, field)} is protocol-relative, so it names another host. The host accepts same-origin URLs only and ${refusal}.`,
      path: pathOf(index, field),
    };
  }
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

export function validateSameOriginUrls(
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

export function isHttpUrl(raw: unknown): boolean {
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
