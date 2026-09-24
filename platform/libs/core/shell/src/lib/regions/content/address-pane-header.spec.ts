import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { MenuTriggerDirective } from '../../menu/menu-trigger.directive';
import { CONTENT_DOCK } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { VIEW_CONTEXT_MENU } from '../pane/chrome/strip-tab';
import { TAB_CONTEXT_MENU } from './tabs/tab-context-menu';
import { ContentTabsService } from './tabs/content-tabs.service';
import { provideShellFeatures } from '../../foundation/shell-features';
import { ShellFeaturesInput } from '../../foundation/shell-features';
import { AddressPaneHeader } from './address-pane-header';

@Component({ selector: 'lw-test-home', template: '<span>home</span>' })
class HomeView {}

describe('AddressPaneHeader — the menu a tab in the unsplit main area offers', () => {
  async function tabMenus(): Promise<
    { menu: unknown; context: Record<string, unknown> }[]
  > {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [provideRouter([])],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({ path: '', component: HomeView });
    registry.addContentRoute({ path: 'doc/a', component: HomeView });
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'outline.title',
      component: HomeView,
    });
    TestBed.inject(PaneTreeService).seedPrimaryTabs(CONTENT_DOCK, [
      'view:outline',
    ]);
    TestBed.inject(ContentTabsService).open({
      path: 'doc/a',
      title: 'A',
      titleIsLiteral: true,
    });

    const fixture = TestBed.createComponent(AddressPaneHeader);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.debugElement
      .queryAll(By.directive(MenuTriggerDirective))
      .map((element) => element.injector.get(MenuTriggerDirective))
      .map((trigger) => ({ menu: trigger.menu(), context: trigger.context() }));
  }

  it('gives a view tab the view menu against the content dock', async () => {
    const viewTab = (await tabMenus()).find(
      (tab) => tab.context['targetKind'] === 'view-tab',
    );
    expect(viewTab).toMatchObject({
      menu: VIEW_CONTEXT_MENU,
      context: { viewId: 'outline', region: CONTENT_DOCK },
    });
  });

  it('leaves a content tab beside it its own menu', async () => {
    const contentTab = (await tabMenus()).find(
      (tab) => tab.context['targetKind'] === 'content-tab',
    );
    expect(contentTab).toMatchObject({
      menu: TAB_CONTEXT_MENU,
      context: { tabId: 'doc/a' },
    });
  });
});

describe('AddressPaneHeader — the split controls of the address pane', () => {
  async function toolbarWith(
    features: ShellFeaturesInput,
  ): Promise<HTMLElement> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [provideRouter([]), provideShellFeatures(features)],
    });
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: '',
      component: HomeView,
    });
    const fixture = TestBed.createComponent(AddressPaneHeader);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const splitControls = (host: HTMLElement) => [
    host.querySelector('[data-testid="content-split-toggle"]'),
    host.querySelector('[data-testid="content-split-down"]'),
  ];

  it('draws both split controls for the full workbench', async () => {
    expect(splitControls(await toolbarWith({}))).not.toContain(null);
  });

  it('draws neither where only the buttons are switched off', async () => {
    const host = await toolbarWith({
      content: { splitRightButton: false, splitDownButton: false },
    });

    expect(splitControls(host)).toEqual([null, null]);
  });

  it('draws neither where splitting itself is off, whatever the buttons say', async () => {
    const host = await toolbarWith({
      content: {
        splitRight: false,
        splitRightButton: true,
        splitDown: false,
        splitDownButton: true,
      },
    });

    expect(splitControls(host)).toEqual([null, null]);
  });
});
