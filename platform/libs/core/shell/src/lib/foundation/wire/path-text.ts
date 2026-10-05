export function withoutTrailingSlashes(path: string): string {
  let end = path.length;
  while (end > 0 && path[end - 1] === '/') {
    end -= 1;
  }
  return path.slice(0, end);
}
