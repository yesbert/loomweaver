import {
  Directive,
  ElementRef,
  OnChanges,
  OnDestroy,
  TemplateRef,
  inject,
  input,
} from '@angular/core';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { RetainedSlot } from './retained-view-model';
import { RetainedViewStash } from './retained-view-stash';
import { placeBefore } from './atomic-move';
import { surfaceRetentionMode } from './retention-policy';

interface MountedTemplate {
  readonly key: string;
  readonly template: TemplateRef<unknown>;
  readonly slot: RetainedSlot;
  path: string;
}

@Directive({ selector: '[lwRetainedTemplate]' })
export class RetainedTemplate implements OnChanges, OnDestroy {
  readonly lwRetainedTemplate = input.required<TemplateRef<unknown>>();
  readonly retentionKey = input.required<string>();
  readonly retentionPath = input<string>('');

  private readonly stash = inject(RetainedViewStash);
  private readonly registry = inject(ContributionRegistry);
  private readonly anchor: Node = inject(ElementRef).nativeElement;

  private mounted: MountedTemplate | null = null;

  ngOnChanges(): void {
    const key = this.retentionKey();
    const template = this.lwRetainedTemplate();
    const mounted = this.mounted;
    if (mounted?.key === key && mounted.template === template) {
      mounted.path = this.retentionPath();
      return;
    }
    this.unmount(key);
    const slot = this.stash.acquire(key, template, () => ({
      view: template.createEmbeddedView(undefined),
    }));
    placeBefore(this.anchor, slot.rootNodes);
    this.mounted = { key, template, slot, path: this.retentionPath() };
  }

  ngOnDestroy(): void {
    this.unmount(null);
  }

  private unmount(nextKey: string | null): void {
    const mounted = this.mounted;
    this.mounted = null;
    if (!mounted) {
      return;
    }
    const survivable =
      mounted.key !== nextKey &&
      surfaceRetentionMode(this.registry.contentRoutes(), mounted.path) ===
        'move';
    if (survivable) {
      mounted.slot.detach(false);
      return;
    }
    mounted.slot.discard();
  }
}
