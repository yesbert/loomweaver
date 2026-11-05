const PLAIN_PATH = /^[\w\-.!~*'@:$,&/]*$/;
const ROUTER_SYNTAX = /[;()]/;
const WRITTEN_AS_ITSELF = /%(?:40|3A|24|2C|26)/gi;

export function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
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
