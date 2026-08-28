import { Component, CUSTOM_ELEMENTS_SCHEMA, afterNextRender, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import { filter, map } from 'rxjs';
import { EntryMessage, entryById, entryDraft } from './testbed-entries';
import { formatWaiting } from './testbed-list-view';
import { testbedContent } from '../plugin/testbed-content';

const SUB_TABS = ['detail', 'meta'] as const;
type SubTab = (typeof SUB_TABS)[number];

function toSubTab(rest: string): SubTab {
  const first = rest.split('/')[0];
  return SUB_TABS.includes(first as SubTab) ? (first as SubTab) : 'detail';
}

function toMessageId(rest: string): string {
  const [head, id] = rest.split('/');
  return head === 'message' ? (id ?? '') : '';
}

@Component({
  selector: 'lw-testbed-entry-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [RouterOutlet, TranslocoPipe],
  templateUrl: './testbed-entry-view.html',
})
export class TestbedEntryView implements DirtySurface {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly entry = entryById(this.id);
  private readonly sent = entryDraft(this.id);
  protected readonly draft = signal(this.sent());
  protected readonly dirty = computed(() => this.draft() !== this.sent());
  protected readonly subTabs = SUB_TABS;
  private readonly tabRoot = 'entry/' + this.id;

  private readonly hostMounted = this.route.snapshot.routeConfig === null;
  private readonly hostSub = signal<string>(
    String(this.route.snapshot.data['sub'] ?? ''),
  );

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly rest = computed<string>(() => {
    if (this.hostMounted) {
      return this.hostSub();
    }
    const path = this.currentUrl().split(/[?#]/)[0].replace(/^\/+/, '');
    return path.startsWith(this.tabRoot + '/')
      ? path.slice(this.tabRoot.length + 1)
      : '';
  });

  protected readonly sub = computed<SubTab>(() => toSubTab(this.rest()));

  protected readonly messageId = computed<string>(() =>
    toMessageId(this.rest()),
  );

  constructor() {
    afterNextRender(() => {
      if (this.entry && !this.hostMounted) {
        testbedContent.openEntry(this.entry);
      }
    });
  }

  surfaceDirty(): boolean {
    return this.dirty();
  }

  surfaceSave(): Promise<void> {
    this.sent.set(this.draft());
    return Promise.resolve();
  }

  protected waiting(minutes: number): string {
    return formatWaiting(minutes);
  }

  protected author(message: EntryMessage): string {
    return message.from;
  }

  protected send(): void {
    void this.surfaceSave();
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected picked(index: number): boolean {
    return this.messageId() === String(index + 1);
  }

  protected openSub(sub: SubTab): void {
    this.go(sub);
  }

  protected openMessage(index: number): void {
    this.go('message/' + (index + 1));
  }

  private go(rest: string): void {
    if (this.hostMounted) {
      this.hostSub.set(rest);
      return;
    }
    void this.router.navigateByUrl('/' + this.tabRoot + '/' + rest);
  }
}
