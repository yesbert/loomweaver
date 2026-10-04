import { effect, Injector } from '@angular/core';
import { MenuContext, MenuHeader } from '@loomweaver/plugin-sdk';
import { Wording } from '../../../i18n/wording';
import { ResolvedEntry } from '../../../menu/menu-resolution';
import { MenuAnswer, MenuService } from '../../../menu/menu.service';
import type {
  LwSlotHeader,
  LwSlotView,
} from '../../../surface-kit/surface-kit.frame';
import { ToolbarEntry } from '../../toolbar/toolbar-entries';
import {
  MORE_KEY,
  ToolbarSlots,
  ToolbarSlotView,
} from '../../toolbar/toolbar-slots.service';

export type SlotPush = (subscription: string, view: LwSlotView) => void;

interface MenuOpening {
  readonly menu: string;
  readonly context: MenuContext;
  readonly header?: MenuHeader;
}

interface Subscription {
  readonly stop: () => void;
  readonly run: (key: string) => void;
  readonly opening: (key: string) => MenuOpening | undefined;
  last?: LwSlotView;
}

export function frameSlotView(view: ToolbarSlotView): LwSlotView {
  return {
    label: view.label,
    moreLabel: view.moreLabel,
    entries: view.entries.map((entry) => ({
      key: entry.key,
      label: entry.label,
      group: entry.group,
      order: entry.order,
      icon: entry.icon,
      shortcut: entry.shortcut,
      pressed: entry.pressed,
      disabled: entry.disabled,
      opensMenu: entry.opensMenu,
    })),
  };
}

export class SlotBridge {
  private readonly subscriptions = new Map<string, Subscription>();

  private readonly menus: MenuService;

  private readonly wording: Wording;

  private counter = 0;

  constructor(
    private readonly slots: ToolbarSlots,
    private readonly injector: Injector,
    private readonly push: SlotPush,
  ) {
    this.menus = injector.get(MenuService);
    this.wording = injector.get(Wording);
  }

  watch(slot: string, context: MenuContext): string {
    let resolved: readonly ResolvedEntry<ToolbarEntry>[] = [];
    const find = (key: string) =>
      resolved.find((candidate) => candidate.item.id === key);
    return this.subscribe(
      () => {
        const view = this.slots.view(slot, context);
        resolved = view.resolved;
        return frameSlotView(view);
      },
      (key) => {
        const entry = find(key);
        if (entry) {
          this.slots.run(entry, context);
        }
      },
      (key) => {
        const entry = find(key);
        return entry?.opensMenu === undefined || entry.disabled
          ? undefined
          : {
              menu: entry.opensMenu,
              context: this.slots.contextFor(entry.item, context),
              header: entry.item.menuHeader,
            };
      },
    );
  }

  open(subscription: string, key: string): string | undefined {
    const opening = this.subscriptions.get(subscription)?.opening(key);
    if (!opening) {
      return undefined;
    }
    let answer: MenuAnswer = { entries: [] };
    return this.subscribe(
      () => {
        answer = this.menus.answer(
          [opening.menu],
          opening.context,
          opening.header,
        );
        return this.menuView(answer, opening.header);
      },
      (chosen) => this.menus.choose(answer, chosen, opening.context),
      () => undefined,
    );
  }

  unwatch(subscription: string): void {
    this.subscriptions.get(subscription)?.stop();
    this.subscriptions.delete(subscription);
  }

  activate(subscription: string, key: string): void {
    this.subscriptions.get(subscription)?.run(key);
  }

  replay(): void {
    for (const [id, entry] of this.subscriptions) {
      if (entry.last) {
        this.push(id, entry.last);
      }
    }
  }

  stopAll(): void {
    for (const entry of this.subscriptions.values()) {
      entry.stop();
    }
    this.subscriptions.clear();
  }

  private subscribe(
    view: () => LwSlotView,
    run: (key: string) => void,
    opening: (key: string) => MenuOpening | undefined,
  ): string {
    this.counter += 1;
    const id = `slot-${this.counter}`;
    const entry: Subscription = { run, opening, stop: () => ref.destroy() };
    this.subscriptions.set(id, entry);
    const ref = effect(
      () => {
        const framed = view();
        entry.last = framed;
        queueMicrotask(() => {
          if (this.subscriptions.get(id) === entry) {
            this.push(id, framed);
          }
        });
      },
      { injector: this.injector },
    );
    return id;
  }

  private menuView(answer: MenuAnswer, header?: MenuHeader): LwSlotView {
    const translate = (key: string) => this.wording.translate(key);
    return {
      label: header ? translate(header.title) : '',
      moreLabel: translate(MORE_KEY),
      header: header && this.headerView(header, answer),
      entries: answer.entries.map((entry) => ({
        key: entry.key,
        label: translate(entry.title),
        group: entry.group,
        order: entry.order,
        icon: entry.icon,
        shortcut: entry.shortcut,
        pressed: entry.checkbox ? entry.checked : undefined,
        disabled: entry.disabled,
      })),
    };
  }

  private headerView(header: MenuHeader, answer: MenuAnswer): LwSlotHeader {
    const translate = (key: string) => this.wording.translate(key);
    return {
      title: translate(header.title),
      detail: header.detail && translate(header.detail),
      icon: header.icon,
      initials: header.initials,
      image: header.image,
      leadsTo: answer.leadsTo && translate(answer.leadsTo.title),
    };
  }
}
