const PLAIN_PATH = /^[\w\-.!~*'@:$,&/]*$/;
const ROUTER_SYNTAX = /;|\([^():]*:/;
const WRITTEN_AS_ITSELF = /%(?:40|3A|24|2C|26)/gi;

const ESCAPES = /(?:%[0-9a-f]{2})+/gi;

export function decodeSegment(segment: string): string {
  return segment.replaceAll(ESCAPES, (escapes) => {
    try {
      return decodeURIComponent(escapes);
    } catch {
      return escapes;
    }
  });
}

export function encodeSegment(value: string): string {
  try {
    return encodeURIComponent(value)
      .replaceAll(WRITTEN_AS_ITSELF, (escape) => decodeURIComponent(escape))
      .replaceAll('(', '%28')
      .replaceAll(')', '%29');
  } catch {
    return value;
  }
}

export function normalizePath(url: string): string {
  const path = url.split(/[?#]/, 1)[0].replace(/^\/+/, '');
  return PLAIN_PATH.test(path) || ROUTER_SYNTAX.test(path)
    ? path
    : path
        .split('/')
        .map((segment) => encodeSegment(decodeSegment(segment)))
        .join('/');
}

export function samePath(one: string, other: string): boolean {
  return normalizePath(one) === normalizePath(other);
}

export function segmentsOf(path: string): string[] {
  return normalizePath(path).split('/').filter(Boolean);
}

export function addressForm(path: string): string {
  return segmentsOf(path).join('/');
}

export function addressSlot(path: string): string {
  return segmentsOf(path)
    .map((segment) => (segment.startsWith(':') ? ':' : segment))
    .join('/');
}
