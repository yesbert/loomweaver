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
import { ToolbarRegistry } from '../../contributions/toolbar-registry';
import {
  LW_TOOLBAR_CONTEXT,
  LW_TOOLBAR_SELECT,
  LwToolbarContextDetail,
  LwToolbarElement,
  LwToolbarSelectDetail,
} from '../../elements/toolbar/lw-toolbar.element';
import {
  installedLwToolbarHost,
  installLwToolbarHost,
  LwToolbarHost,
} from '../../elements/toolbar/toolbar-bridge';
import { menuOnContext } from '../../menu/chrome-item-menu';
import { ResolvedEntry } from '../../menu/menu-resolution';
import { MenuService } from '../../menu/menu.service';
import { ToolbarEntry } from './toolbar-entries';
import { ToolbarSlots } from './toolbar-slots.service';

interface Attachment {
  readonly cells: Map<string, ComponentRef<unknown>>;
  readonly effect: EffectRef;
  readonly onSelect: (event: Event) => void;
  readonly onContext: (event: Event) => void;
  resolved: readonly ResolvedEntry<ToolbarEntry>[];
}

@Service()
export class ToolbarHost implements LwToolbarHost {
  private readonly toolbars = inject(ToolbarRegistry);

  private readonly slots = inject(ToolbarSlots);

  private readonly menus = inject(MenuService);

  private readonly auth = inject(AuthContext);

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
    const view = this.slots.view(slot, context, toolbar.getAttribute('label'));
    attachment.resolved = view.resolved;
    toolbar.entries = view.entries;
    toolbar.moreLabel = view.moreLabel;
    toolbar.label = view.label;
    toolbar.openKey = this.openKeyOf(toolbar, view.resolved);
    this.drawCells(toolbar, attachment, slot, context);
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

  private select(toolbar: LwToolbarElement, detail: LwToolbarSelectDetail): void {
    const attachment = this.attachments.get(toolbar);
    const entry = attachment?.resolved.find((candidate) => candidate.item.id === detail.key);
    if (!entry || entry.disabled) {
      return;
    }
    const context = toolbar.context;
    if (entry.opensMenu !== undefined) {
      this.menus.open(
        entry.opensMenu,
        this.slots.contextFor(entry.item, context),
        { rect: detail.trigger.getBoundingClientRect(), side: 'bottom' },
        { trigger: detail.trigger, header: entry.item.menuHeader },
      );
      this.changed(toolbar);
      return;
    }
    this.slots.run(entry, context);
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
    this.menus.open(menu, this.slots.contextFor(entry.item, toolbar.context), {
      x: detail.x,
      y: detail.y,
    });
  }
}
