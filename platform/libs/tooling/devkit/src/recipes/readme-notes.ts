export const UNTAGGED_NOTE: readonly string[] = [
  'The project is generated **untagged**: Nx tags belong to your `depConstraints`, and inventing',
  'one would fail a lint policy you never opted this project into. If your workspace enforces',
  'module boundaries, give it tags your constraints allow — `--tags` at generation time, or',
  '`tags` in `project.json` afterwards.',
];

export function asBullet(lines: readonly string[]): string[] {
  return lines.map((line, index) => (index === 0 ? `- ${line}` : `  ${line}`));
}
