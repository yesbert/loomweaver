export interface Io {
  out(line: string): void;
  err(line: string): void;
}
