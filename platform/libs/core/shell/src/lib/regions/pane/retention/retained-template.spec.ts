import { Component, OnDestroy, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { RetainedTemplate } from './retained-template';

let instances: ProbeView[] = [];
let destroyed = 0;

@Component({
  selector: 'lw-retention-probe',
  template: `<span data-testid="probe">{{ draft() }}</span>`,
})
class ProbeView implements OnDestroy {
  readonly draft = signal('');

  constructor() {
    instances.push(this);
  }

  ngOnDestroy(): void {
    destroyed += 1;
  }
}

@Component({
  imports: [RetainedTemplate, ProbeView],
  template: `
    @if (slot() === 'a') {
      <div data-testid="slot-a">
        <ng-container
          [lwRetainedTemplate]="probeTpl"
          retentionKey="primary:test"
          [retentionPath]="path()"
        />
      </div>
    } @else if (slot() === 'b') {
      <section data-testid="slot-b">
        <ng-container
          [lwRetainedTemplate]="probeTpl"
          retentionKey="primary:test"
          [retentionPath]="path()"
        />
      </section>
    }
    <ng-template #probeTpl><lw-retention-probe /></ng-template>
  `,
})
class TemplateHost {
  readonly slot = signal<'a' | 'b' | 'none'>('a');
  readonly path = signal('notes');
}

@Component({
  imports: [RetainedTemplate, ProbeView],
  template: `
    @if (slot() === 'a') {
      <div data-testid="slot-a">
        <ng-container
          [lwRetainedTemplate]="condTpl"
          retentionKey="primary:cond"
          retentionPath="notes"
        />
      </div>
    } @else if (slot() === 'b') {
      <section data-testid="slot-b">
        <ng-container
          [lwRetainedTemplate]="condTpl"
          retentionKey="primary:cond"
          retentionPath="notes"
        />
      </section>
    }
    <ng-template #condTpl>
      @if (inner()) {
        <lw-retention-probe />
      }
    </ng-template>
  `,
})
class ConditionalTemplateHost {
  readonly slot = signal<'a' | 'b'>('a');
  readonly inner = signal(true);
}

async function afterSweep(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function element(fixture: { nativeElement: HTMLElement }, selector: string) {
  return fixture.nativeElement.querySelector(selector);
}

describe('surface retention', () => {
  beforeEach(() => {
    localStorage.clear();
    instances = [];
    destroyed = 0;
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'notes',
      component: ProbeView,
    });
  });

  describe('RetainedTemplate', () => {
    it('moves the primary view across a branch swap instead of rebuilding it (the split fix)', async () => {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.detectChanges();
      expect(instances).toHaveLength(1);
      instances[0].draft.set('typed');

      fixture.componentInstance.slot.set('b');
      fixture.detectChanges();
      await afterSweep();

      expect(instances).toHaveLength(1);
      expect(destroyed).toBe(0);
      TestBed.tick();
      expect(
        element(fixture, '[data-testid="slot-b"] [data-testid="probe"]')
          ?.textContent,
      ).toBe('typed');
    });

    it('destroys the view once it is hidden and nobody reclaims it', async () => {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.detectChanges();

      fixture.componentInstance.slot.set('none');
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(1);
    });

    it('moves branch content rendered after creation — a template rooted in a control-flow block', async () => {
      const fixture = TestBed.createComponent(ConditionalTemplateHost);
      fixture.detectChanges();
      TestBed.tick();
      expect(instances).toHaveLength(1);
      instances[0].draft.set('typed');

      fixture.componentInstance.slot.set('b');
      fixture.detectChanges();
      await afterSweep();

      expect(instances).toHaveLength(1);
      expect(destroyed).toBe(0);
      TestBed.tick();
      expect(
        element(fixture, '[data-testid="slot-b"] [data-testid="probe"]')
          ?.textContent,
      ).toBe('typed');
    });

    it('lets the hidden primary slot go, even when its surface declares retain', async () => {
      TestBed.inject(ContributionRegistry).addContentRoute({
        path: 'editor',
        component: ProbeView,
        retain: 'always',
      } as ContentRoute);
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.path.set('editor');
      fixture.detectChanges();

      fixture.componentInstance.slot.set('none');
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(1);
    });

    it('rebuilds instead of moving when the active path is an iframe surface', async () => {
      TestBed.inject(ContributionRegistry).addContentRoute({
        path: 'frame',
        iframe: '/frame.html',
      } as ContentRoute);
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.path.set('frame');
      fixture.detectChanges();
      expect(instances).toHaveLength(1);

      fixture.componentInstance.slot.set('b');
      fixture.detectChanges();
      await afterSweep();

      expect(instances).toHaveLength(2);
      expect(destroyed).toBe(1);
    });
  });
});
