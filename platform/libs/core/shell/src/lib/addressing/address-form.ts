export function normalizePath(url: string): string {
  return url.split(/[?#]/, 1)[0].replace(/^\/+/, '');
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
