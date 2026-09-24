import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { CONTENT_DOCK, PRIMARY_PANE } from '../../pane/tree/pane-address';
import { paneRetentionScope } from '../../pane/retention/retention-keys';
import { buildContentRoutes } from '../routing/content-route-table';
import { SurfaceBody } from '../surface/surface-body';
import { ContentTabsService } from './content-tabs.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const draftDirty = signal(true);

@Component({ selector: 'lw-draft-content', template: '' })
class DraftContent {
  surfaceDirty(): boolean {
    return draftDirty();
  }
}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent },
  { path: 'draft/:id', component: DraftContent },
];

describe('ContentTabsService', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(ROUTES))],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    service = TestBed.inject(ContentTabsService);
    harness = await RouterTestingHarness.create();
  });

  it('answers whether an address holds unsaved work, and follows it being saved', async () => {
    draftDirty.set(true);
    await harness.navigateByUrl('/draft/a');
    const pane = TestBed.createComponent(SurfaceBody);
    pane.componentRef.setInput('path', 'draft/a');
    pane.componentRef.setInput('carriesAddress', true);
    pane.componentRef.setInput(
      'retentionScope',
      paneRetentionScope(CONTENT_DOCK, PRIMARY_PANE),
    );
    pane.detectChanges();

    expect(service.hasUnsavedWork('draft/a')).toBe(true);
    expect(service.hasUnsavedWork('doc/b')).toBe(false);

    draftDirty.set(false);

    expect(service.hasUnsavedWork('draft/a')).toBe(false);
  });
});
