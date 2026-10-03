import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  DestroyRef,
  effect,
  EffectRef,
  EnvironmentInjector,
  inject,
  Injector,
  Service,
  untracked,
} from '@angular/core';
import { MenuContext, TOOLBAR_CONTEXT, ToolbarCell } from '@loomweaver/plugin-sdk';
import { AuthContext } from '../../auth/auth-context';
import { CommandService } from '../../commands/command.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import {
  surfaceOfActionsSlot,
  ToolbarRegistry,
} from '../../contributions/toolbar-registry';
import {
  LW_TOOLBAR_CONTEXT,
  LW_TOOLBAR_SELECT,
  LwToolbarContextDetail,
  LwToolbarElement,
  LwToolbarEntry,
  LwToolbarSelectDetail,
} from '../../elements/toolbar/lw-toolbar.element';
import {
  installedLwToolbarHost,
  installLwToolbarHost,
  LwToolbarHost,
} from '../../elements/toolbar/toolbar-bridge';
import { Wording } from '../../i18n/wording';
import { menuOnContext } from '../../menu/chrome-item-menu';
import { ResolvedEntry } from '../../menu/menu-resolution';
import { MenuService } from '../../menu/menu.service';
import { SlotResolution } from '../../menu/slot-resolution.service';
import {
  entryOfAction,
  entryOfMenuItem,
  ToolbarEntry,
} from './toolbar-entries';

const MORE_KEY = 'bar.more';

interface Attachment {
  readonly cells: Map<string, ComponentRef<unknown>>;
  readonly effect: EffectRef;
  readonly onSelect: (event: Event) => void;
  readonly onContext: (event: Event) => void;
  resolved: readonly ResolvedEntry<ToolbarEntry>[];
}

@Service()
export class ToolbarHost implements LwToolbarHost {
  private readonly registry = inject(ContributionRegistry);

  private readonly toolbars = inject(ToolbarRegistry);

  private readonly slots = inject(SlotResolution);

  private readonly menus = inject(MenuService);

  private readonly commands = inject(CommandService);

  private readonly auth = inject(AuthContext);

  private readonly wording = inject(Wording);

  private readonly injector = inject(EnvironmentInjector);

  private readonly appRef = inject(ApplicationRef);

  private readonly attachments = new Map<LwToolbarElement, Attachment>();

  constructor() {
    installLwToolbarHost(this);
    inject(DestroyRef).onDestroy(() => {
      if (installedLwToolbarHost() === this) {
        installLwToolbarHost(undefined);
      }
    });
  }

  attach(toolbar: LwToolbarElement): void {
    if (this.attachments.has(toolbar)) {
      return;
    }
    const attachment: Attachment = {
      cells: new Map(),
      resolved: [],
      onSelect: (event) =>
        this.select(toolbar, (event as CustomEvent<LwToolbarSelectDetail>).detail),
      onContext: (event) =>
        this.openContextMenu(
          toolbar,
          (event as CustomEvent<LwToolbarContextDetail>).detail,
        ),
      effect: effect(() => this.draw(toolbar), { injector: this.injector }),
    };
    toolbar.addEventListener(LW_TOOLBAR_SELECT, attachment.onSelect);
    toolbar.addEventListener(LW_TOOLBAR_CONTEXT, attachment.onContext);
    this.attachments.set(toolbar, attachment);
    untracked(() => this.draw(toolbar));
  }

  changed(toolbar: LwToolbarElement): void {
    if (this.attachments.has(toolbar)) {
      untracked(() => this.draw(toolbar));
    }
  }

  detach(toolbar: LwToolbarElement): void {
    const attachment = this.attachments.get(toolbar);
    if (!attachment) {
      return;
    }
    this.attachments.delete(toolbar);
    attachment.effect.destroy();
    toolbar.removeEventListener(LW_TOOLBAR_SELECT, attachment.onSelect);
    toolbar.removeEventListener(LW_TOOLBAR_CONTEXT, attachment.onContext);
    for (const cell of attachment.cells.values()) {
      cell.destroy();
    }
    attachment.cells.clear();
  }

  private draw(toolbar: LwToolbarElement): void {
    const attachment = this.attachments.get(toolbar);
    const slot = toolbar.menu;
    if (!attachment || !slot) {
      return;
    }
    const context = toolbar.context;
    const resolved = this.slots.resolve(this.entriesOf(slot), (entry) =>
      this.contextFor(entry, context),
    );
    attachment.resolved = resolved;
    toolbar.entries = resolved.map((entry) => this.drawn(entry));
    toolbar.moreLabel = this.wording.translate(MORE_KEY);
    toolbar.label = this.wording.translate(
      toolbar.getAttribute('label') ?? this.toolbars.titleOf(slot) ?? '',
    );
    toolbar.openKey = this.openKeyOf(toolbar, resolved);
    this.drawCells(toolbar, attachment, slot, context);
  }

  private drawn(entry: ResolvedEntry<ToolbarEntry>): LwToolbarEntry {
    return {
      key: entry.item.id,
      label: this.wording.translate(entry.title ?? ''),
      group: entry.group,
      order: entry.order,
      icon: entry.icon,
      shortcut: entry.shortcut,
      pressed: entry.pressed,
      disabled: entry.disabled,
      opensMenu: entry.opensMenu !== undefined,
      hasContextMenu: menuOnContext(entry.item) !== undefined,
    };
  }

  private openKeyOf(
    toolbar: LwToolbarElement,
    resolved: readonly ResolvedEntry<ToolbarEntry>[],
  ): string | null {
    const trigger = this.menus.openTrigger();
    if (!trigger || !toolbar.contains(trigger)) {
      return null;
    }
    return (
      resolved.find((entry) => toolbar.buttonOf(entry.item.id) === trigger)
        ?.item.id ?? null
    );
  }

  private drawCells(
    toolbar: LwToolbarElement,
    attachment: Attachment,
    slot: string,
    context: MenuContext,
  ): void {
    const wanted = this.toolbars
      .cells()
      .filter((cell) => cell.slot === slot && this.auth.visible(cell.access));
    let changed = false;
    for (const [id, ref] of attachment.cells) {
      if (wanted.some((cell) => cell.id === id)) {
        continue;
      }
      ref.destroy();
      attachment.cells.delete(id);
      changed = true;
    }
    for (const cell of wanted) {
      if (attachment.cells.has(cell.id)) {
        continue;
      }
      attachment.cells.set(cell.id, this.mountCell(toolbar, cell, slot, context));
      changed = true;
    }
    if (changed) {
      toolbar.refresh();
    }
  }

  private mountCell(
    toolbar: LwToolbarElement,
    cell: ToolbarCell,
    slot: string,
    context: MenuContext,
  ): ComponentRef<unknown> {
    const ref = createComponent(cell.component, {
      environmentInjector: this.injector,
      elementInjector: Injector.create({
        parent: this.injector,
        providers: [{ provide: TOOLBAR_CONTEXT, useValue: { slot, context } }],
      }),
    });
    const host = ref.location.nativeElement as HTMLElement;
    host.setAttribute('data-lw-cell', cell.id);
    host.setAttribute('order', String(cell.order ?? 0));
    toolbar.append(host);
    this.appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    return ref;
  }

  private entriesOf(slot: string): ToolbarEntry[] {
    const surfaceId = surfaceOfActionsSlot(slot);
    const actions =
      surfaceId === undefined
        ? []
        : this.registry.actionsOf(surfaceId).map((action) => entryOfAction(action));
    const items = this.registry
      .menuItems()
      .filter((item) => item.menu === slot)
      .map((item, index) => entryOfMenuItem(item, index));
    return [...actions, ...items];
  }

  private contextFor(entry: ToolbarEntry, context: MenuContext): MenuContext {
    return { ...context, id: entry.id };
  }

  private select(toolbar: LwToolbarElement, detail: LwToolbarSelectDetail): void {
    const attachment = this.attachments.get(toolbar);
    const entry = attachment?.resolved.find((candidate) => candidate.item.id === detail.key);
    if (!entry || entry.disabled) {
      return;
    }
    const context = this.contextFor(entry.item, toolbar.context);
    if (entry.opensMenu !== undefined) {
      this.menus.open(
        entry.opensMenu,
        context,
        { rect: detail.trigger.getBoundingClientRect(), side: 'bottom' },
        { trigger: detail.trigger, header: entry.item.menuHeader },
      );
      this.changed(toolbar);
      return;
    }
    this.commands.trigger(entry.item, context);
  }

  private openContextMenu(
    toolbar: LwToolbarElement,
    detail: LwToolbarContextDetail,
  ): void {
    const attachment = this.attachments.get(toolbar);
    const entry = attachment?.resolved.find((candidate) => candidate.item.id === detail.key);
    const menu = entry ? menuOnContext(entry.item) : undefined;
    if (!entry || !menu) {
      return;
    }
    this.menus.open(menu, this.contextFor(entry.item, toolbar.context), {
      x: detail.x,
      y: detail.y,
    });
  }
}
