import { isDevMode, Service } from '@angular/core';
import { Disposable } from '@loomweaver/plugin-sdk';
import {
  hasIcon,
  removeIcon,
  resolveIcon,
  sanitizeIconSvg,
  setIcon,
} from './icon-registry-global';

@Service()
export class IconRegistry {
  register(
    pluginId: string,
    icons: Readonly<Record<string, string>>,
  ): Disposable {
    const added: string[] = [];
    for (const [name, svg] of Object.entries(icons)) {
      if (hasIcon(name)) {
        this.warn(
          `Plugin "${pluginId}" tried to contribute icon "${name}", but that name is already ` +
            `registered — ignored (first-wins). Pick a unique name.`,
        );
        continue;
      }
      const safe = sanitizeIconSvg(svg);
      if (safe.length === 0) {
        this.warn(
          `Plugin "${pluginId}" contributed icon "${name}" whose SVG did not survive ` +
            `sanitization — ignored.`,
        );
        continue;
      }
      setIcon(name, safe);
      added.push(name);
    }
    return { dispose: () => { for (const name of added) removeIcon(name) } };
  }

  resolve(name: string): string | undefined {
    return resolveIcon(name);
  }

  private warn(message: string): void {
    if (isDevMode()) {
      console.warn(message);
    }
  }
}
