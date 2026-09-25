import { FileMap, Recipe } from '../../lib/generate/types';
import { agentFiles } from './agent-files';
import { i18nFile } from './weaver-i18n';
import { resolveWeaverInput, type ResolvedWeaver, type WeaverInput } from './weaver-input';
import { pluginFile } from './weaver-plugin';
import { readmeFile } from './weaver-readme';
import {
  aboutDialogFile,
  aboutDialogTemplateFile,
  childViewFile,
  childViewTemplateFile,
  specFile,
  viewFile,
  viewTemplateFile,
} from './weaver-views';

function indexFile(weaver: ResolvedWeaver): string {
  return `export { ${weaver.propertyName}Plugin } from './lib/plugin/${weaver.id}.plugin';\n`;
}

export const angularWeaver: Recipe<WeaverInput> = {
  id: 'angular-weaver',
  build(input: WeaverInput): FileMap {
    const weaver = resolveWeaverInput(input);
    const files: Record<string, string> = {
      'src/index.ts': indexFile(weaver),
      [`src/lib/plugin/${weaver.id}.plugin.ts`]: pluginFile(weaver),
      'src/lib/i18n/en.json': i18nFile(weaver),
      'src/lib/i18n/de.json': i18nFile(weaver),
      'README.md': readmeFile(weaver),
    };
    if (weaver.features.container) {
      files[`src/lib/views/${weaver.id}-canvas-view.ts`] = childViewFile(
        weaver,
        'canvas',
        `${weaver.className}CanvasView`,
      );
      files[`src/lib/views/${weaver.id}-canvas-view.html`] = childViewTemplateFile(
        weaver,
        'Canvas',
      );
      files[`src/lib/views/${weaver.id}-details-view.ts`] = childViewFile(
        weaver,
        'details',
        `${weaver.className}DetailsView`,
      );
      files[`src/lib/views/${weaver.id}-details-view.html`] = childViewTemplateFile(
        weaver,
        'Details',
      );
    } else {
      files[`src/lib/views/${weaver.id}-view.ts`] = viewFile(weaver);
      files[`src/lib/views/${weaver.id}-view.html`] = viewTemplateFile(weaver);
    }
    if (weaver.features.about) {
      files[`src/lib/dialogs/${weaver.id}-about-dialog.ts`] = aboutDialogFile(weaver);
      files[`src/lib/dialogs/${weaver.id}-about-dialog.html`] =
        aboutDialogTemplateFile(weaver);
    }
    if (weaver.features.agent) {
      Object.assign(files, agentFiles(weaver));
    }
    if (weaver.features.spec) {
      files[`src/lib/plugin/${weaver.id}.plugin.spec.ts`] = specFile(weaver);
    }
    return files;
  },
};
