export function declarationAsScript(declaration) {
  const asScript = declaration
    .replaceAll(/^export \{\};?\n?/gm, '')
    .replaceAll(/^export declare /gm, 'declare ')
    .replaceAll(/^export /gm, '')
    .trim();
  if (/^(import|export)\b/m.test(asScript)) {
    throw new Error(
      'the frame declaration reaches beyond its own shapes — it must stay self-contained',
    );
  }
  return asScript;
}
