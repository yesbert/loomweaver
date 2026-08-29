import { Amendment } from '../amend/types';
import { FileMap, Recipe } from './types';

function isUnsafePath(path: string): boolean {
  return (
    path.length === 0 ||
    path.startsWith('/') ||
    path.includes('\\') ||
    path.split('/').includes('..')
  );
}

export function generate<Input>(recipe: Recipe<Input>, input: Input): FileMap {
  const files = recipe.build(input);
  const unsafe = Object.keys(files).find((path) => isUnsafePath(path));
  if (unsafe !== undefined) {
    throw new Error(`Recipe "${recipe.id}" produced an unsafe path: "${unsafe}".`);
  }
  return files;
}

export function amendments<Input>(
  recipe: Recipe<Input>,
  input: Input,
): readonly Amendment[] {
  return recipe.amend?.(input) ?? [];
}
