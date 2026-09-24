import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS } from '@loomweaver/plugin-sdk';
import { ShellRail } from './shell-rail';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { ActiveWorkspaceService } from '../../workspace/active-workspace.service';
import { WorkspaceService } from '../../workspace/workspace.service';
import { RailItem } from '../../foundation/rail-item';
import { RailItemsService, workspaceRailItemId } from './rail-items.service';
import { provideShellFeatures } from '../../foundation/shell-features';

function buttonsOf(fixture: ComponentFixture<ShellRail>) {
  return fixture.nativeElement.querySelectorAll(
    'button',
  ) as NodeListOf<HTMLButtonElement>;
}

describe('ShellRail workspace entries', () => {
  const switched: string[] = [];
  let activeId: WritableSignal<string>;

  beforeEach(() => {
    origins = {};
    savedInRail = true;
  });

  let origins: Record<string, string>;
  let savedInRail: boolean;

  function setupWorkspaces(active: string, ...items: RailItem[]) {
    localStorage.clear();
    switched.length = 0;
    activeId = signal(active);
    TestBed.configureTestingModule({
      imports: [
        ShellRail,
        TranslocoTestingModule.forRoot({
          langs: { en: { cmd: { reset: 'Reset' } } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: AUTH_SOURCE, useValue: signal(ANONYMOUS) },
        provideShellFeatures({ workspaces: { savedInRail } }),
        {
          provide: ActiveWorkspaceService,
          useValue: { id: activeId.asReadonly() },
        },
        {
          provide: WorkspaceService,
          useValue: {
            switchTo: (id: string) => {
              switched.push(id);
              return Promise.resolve();
            },
            originOf: (id: string) => origins[id] ?? null,
          },
        },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const item of items) {
      registry.addRailItem(item);
    }
    const fixture = TestBed.createComponent(ShellRail);
    fixture.componentRef.setInput('region', {
      id: 'activity',
      type: 'rail',
      dock: 'left',
    });
    fixture.detectChanges();
    return fixture;
  }

  const entry = (id: string, workspace: string): RailItem => ({
    id,
    rail: 'activity',
    icon: 'reset',
    title: 'cmd.reset',
    workspace,
  });

  it('marks the entry of the active workspace and no other', () => {
    const fixture = setupWorkspaces(
      'beta',
      entry('a', 'alpha'),
      entry('b', 'beta'),
    );
    const [alpha, beta] = buttonsOf(fixture);

    expect(alpha.getAttribute('aria-current')).toBeNull();
    expect(beta.getAttribute('aria-current')).toBe('true');
  });

  it('moves the marking when the active workspace changes', () => {
    const fixture = setupWorkspaces(
      'alpha',
      entry('a', 'alpha'),
      entry('b', 'beta'),
    );

    activeId.set('beta');
    fixture.detectChanges();
    const [alpha, beta] = buttonsOf(fixture);

    expect(alpha.getAttribute('aria-current')).toBeNull();
    expect(beta.getAttribute('aria-current')).toBe('true');
  });

  it('leaves an ordinary item unmarked whichever workspace is active', () => {
    const fixture = setupWorkspaces('alpha', {
      id: 'plain',
      rail: 'activity',
      icon: 'reset',
      title: 'cmd.reset',
      run: () => undefined,
    });

    expect(buttonsOf(fixture)[0].getAttribute('aria-current')).toBeNull();
  });

  it('drops an entry the user hid from this rail and keeps it out after a rebuild', () => {
    const fixture = setupWorkspaces(
      'alpha',
      entry('a', 'alpha'),
      entry('b', 'beta'),
    );
    expect(buttonsOf(fixture)).toHaveLength(2);

    TestBed.inject(RailItemsService).hide('b');
    fixture.detectChanges();

    expect(buttonsOf(fixture)).toHaveLength(1);
    expect(buttonsOf(fixture)[0].getAttribute('aria-current')).toBe('true');
  });

  it('takes an item out of this rail once it is placed in another one', () => {
    const fixture = setupWorkspaces('alpha', entry('a', 'alpha'));
    TestBed.inject(RailItemsService).place('a', 'activity-right');
    fixture.detectChanges();

    expect(buttonsOf(fixture)).toHaveLength(0);
  });

  it('switches on click, ignoring a command the item also names', () => {
    let ran = 0;
    const fixture = setupWorkspaces('alpha', {
      ...entry('b', 'beta'),
      run: () => (ran += 1),
    });

    buttonsOf(fixture)[0].click();

    expect(switched).toEqual(['beta']);
    expect(ran).toBe(0);
  });

  describe('while a saved workspace is active', () => {
    beforeEach(() => {
      origins = { alpha: 'alpha', beta: 'beta', mine: 'alpha' };
    });

    function placeOwnEntry(rail: string): void {
      TestBed.inject(RailItemsService).place(workspaceRailItemId('mine'), rail);
    }

    it('marks the origin of one the user never placed, and leaves the entry as it is', () => {
      const fixture = setupWorkspaces(
        'mine',
        entry('a', 'alpha'),
        entry('b', 'beta'),
      );
      const [alpha, beta] = buttonsOf(fixture);

      expect(alpha.getAttribute('aria-current')).toBe('true');
      expect(beta.getAttribute('aria-current')).toBeNull();
      expect(alpha.getAttribute('aria-label')).toBe('Reset');
      const icon = alpha.querySelector('lw-icon') as { name?: string } | null;
      expect(icon?.name).toBe('reset');
    });

    it('leaves the origin unmarked once the user placed the workspace itself', () => {
      const fixture = setupWorkspaces('mine', entry('a', 'alpha'));
      placeOwnEntry('activity');
      fixture.detectChanges();

      expect(buttonsOf(fixture)[0].getAttribute('aria-current')).toBeNull();
    });

    it('leaves the origin unmarked when the workspace itself is placed in the other rail', () => {
      const fixture = setupWorkspaces('mine', entry('a', 'alpha'));
      placeOwnEntry('activity-right');
      fixture.detectChanges();

      expect(buttonsOf(fixture)[0].getAttribute('aria-current')).toBeNull();
    });

    it('marks the origin while the product keeps saved workspaces out of the rail, placed or not', () => {
      savedInRail = false;
      const fixture = setupWorkspaces('mine', entry('a', 'alpha'));
      expect(buttonsOf(fixture)[0].getAttribute('aria-current')).toBe('true');

      placeOwnEntry('activity');
      fixture.detectChanges();

      expect(buttonsOf(fixture)[0].getAttribute('aria-current')).toBe('true');
    });

    it('marks nothing for one without an origin', () => {
      origins = { alpha: 'alpha', beta: 'beta' };
      const fixture = setupWorkspaces(
        'mine',
        entry('a', 'alpha'),
        entry('b', 'beta'),
      );

      for (const button of buttonsOf(fixture)) {
        expect(button.getAttribute('aria-current')).toBeNull();
      }
    });

    it('switches to the origin when the marked entry is chosen', () => {
      const fixture = setupWorkspaces('mine', entry('a', 'alpha'));

      buttonsOf(fixture)[0].click();

      expect(switched).toEqual(['alpha']);
    });
  });
});
