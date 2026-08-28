export type { FileMap, Recipe } from './lib/generate/types';
export { generate } from './lib/generate/generate';
export { isKebabId, toCamelCase, toPascalCase, toTitleCase } from './lib/generate/casing';
export {
  angularWeaver,
  resolveWeaverInput,
  type WeaverInput,
  type ResolvedWeaver,
} from './recipes/angular-weaver/recipe';
export {
  framePlugin,
  resolveFramePluginInput,
  type FramePluginInput,
  type ResolvedFramePlugin,
} from './recipes/frame-plugin/recipe';
export {
  angularDistribution,
  resolveDistributionInput,
  type DistributionInput,
  type ResolvedDistribution,
} from './recipes/angular-distribution/recipe';
export {
  authSource,
  resolveAuthSourceInput,
  type AuthSourceInput,
  type ResolvedAuthSource,
} from './recipes/auth-source/recipe';
export {
  settingsStore,
  resolveSettingsStoreInput,
  type SettingsStoreInput,
  type ResolvedSettingsStore,
} from './recipes/settings-store/recipe';
export { theme, resolveThemeInput, type ThemeInput, type ResolvedTheme } from './recipes/theme/recipe';
export {
  layout,
  resolveLayoutInput,
  type LayoutInput,
  type ResolvedLayout,
} from './recipes/layout/recipe';
export {
  SCAFFOLDS,
  findScaffold,
  kebabCase,
  nxSchemaFor,
  portableOptions,
  usageFor,
  type ScaffoldDescriptor,
  type ScaffoldOption,
  type ScaffoldValues,
} from './lib/scaffolds/scaffolds';
export type { Finding, FindingLevel } from './lib/validate/types';
export { validateManifest, KNOWN_CAPABILITIES, type ManifestLike } from './lib/validate/manifest';
export { validateI18nParity, type I18nBundle } from './lib/validate/i18n';
export { validateCatalog, CATALOG_ENTRY_KEYS } from './lib/validate/catalog';
