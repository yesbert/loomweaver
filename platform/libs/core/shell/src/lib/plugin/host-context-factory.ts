import { SurfaceRevealService } from '../views/surface-reveal.service';
import { inject, Service } from '@angular/core';
import { Capability } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from './contribution-registry';
import { HostPluginContext } from './host-plugin-context';
import { SHELL_LAYOUT } from '../layout/layout';
import { IconRegistry } from '../elements/icon/icon-registry';
import { ThemeRegistry } from '../theme/theme-registry';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { DialogService } from '../dialog/dialog.service';
import { NotificationService } from '../notifications/notification.service';
import { SettingsService } from '../settings/settings.service';
import { VersionService } from '../version/version.service';
import { UpdateService } from '../update/update.service';
import { AuthContext } from '../auth/auth-context';
import { MenuService } from '../menu/menu.service';
import { PluginStateService } from './plugin-state.service';
import { COMMAND_INVOKER } from '../foundation/command-invoker';

@Service()
export class HostContextFactory {
  private readonly registry = inject(ContributionRegistry);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  private readonly settings = inject(SettingsService);
  private readonly version = inject(VersionService);
  private readonly update = inject(UpdateService);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly icons = inject(IconRegistry);
  private readonly tabs = inject(ContentTabsService);
  private readonly auth = inject(AuthContext);
  private readonly menu = inject(MenuService);
  private readonly themes = inject(ThemeRegistry);
  private readonly reveal = inject(SurfaceRevealService);
  private readonly state = inject(PluginStateService);
  private readonly invocation = inject(COMMAND_INVOKER);

  create(
    pluginId: string,
    isGranted: (capability: Capability) => boolean,
  ): HostPluginContext {
    return new HostPluginContext(
      pluginId,
      isGranted,
      this.registry,
      this.dialogs,
      this.notifications,
      this.settings,
      this.version,
      this.update,
      this.tabs,
      this.layout.regions,
      this.icons,
      this.auth,
      this.menu,
      this.themes,
      this.reveal,
      this.state,
      this.invocation,
    );
  }
}
