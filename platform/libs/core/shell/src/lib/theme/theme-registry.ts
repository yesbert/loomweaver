import { isDevMode, Service, signal } from '@angular/core';
import { Disposable } from '@loomweaver/plugin-sdk';
import {
  ThemeRegistration,
  addThemeRegistration,
  isKnownToken,
  removeThemeRegistration,
} from './theme-registry-global';

@Service()
export class ThemeRegistry {
  readonly version = signal(0);

  register(
    pluginId: string,
    tokens: Readonly<Record<string, string>>,
    dark?: Readonly<Record<string, string>>,
  ): Disposable {
    const registration: ThemeRegistration = {
      pluginId,
      tokens: this.keepKnownTokens(pluginId, tokens),
      dark: dark ? this.keepKnownTokens(pluginId, dark) : undefined,
    };
    addThemeRegistration(registration);
    this.bump();
    return {
      dispose: () => {
        removeThemeRegistration(registration);
        this.bump();
      },
    };
  }

  private keepKnownTokens(
    pluginId: string,
    tokens: Readonly<Record<string, string>>,
  ): Record<string, string> {
    const applied: Record<string, string> = {};
    for (const [name, value] of Object.entries(tokens)) {
      if (!isKnownToken(name)) {
        this.warn(
          `Plugin "${pluginId}" tried to contribute unknown theme token "${name}" — ignored. ` +
            `Only --lw-* tokens apply.`,
        );
        continue;
      }
      applied[name] = value;
    }
    return applied;
  }

  private bump(): void {
    this.version.update((value) => value + 1);
  }

  private warn(message: string): void {
    if (isDevMode()) {
      console.warn(message);
    }
  }
}
