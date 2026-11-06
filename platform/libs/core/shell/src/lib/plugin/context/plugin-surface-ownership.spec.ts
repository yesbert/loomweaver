import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { pathOwnedBy } from './plugin-surface-ownership';

@Component({ selector: 'lw-test-owned', template: '' })
class TestOwned {}

describe('the addresses a plugin owns', () => {
  let registry: ContributionRegistry;

  beforeEach(() => {
    registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({ path: '', component: TestOwned }, 'start');
    registry.addContentRoute({ path: 'doc/:id', component: TestOwned }, 'docs');
  });

  it('are those its own content declares, at and below it', () => {
    const owns = pathOwnedBy(registry, 'docs');

    expect(owns('doc/7')).toBe(true);
    expect(owns('doc/7/preview')).toBe(true);
    expect(owns('notes/7')).toBe(false);
  });

  it('are not those another plugin declares more closely below one of its own', () => {
    registry.addContentRoute({ path: 'guide', component: TestOwned }, 'guides');
    registry.addContentRoute(
      { path: 'guide/special', component: TestOwned },
      'specials',
    );

    expect(pathOwnedBy(registry, 'guides')('guide/special/x')).toBe(false);
    expect(pathOwnedBy(registry, 'specials')('guide/special/x')).toBe(true);
    expect(pathOwnedBy(registry, 'guides')('guide/other/x')).toBe(true);
  });

  it('do not include every other address for the plugin that registered the home route', () => {
    const owns = pathOwnedBy(registry, 'start');

    expect(owns('doc/7')).toBe(false);
    expect(owns('nowhere/at-all')).toBe(false);
  });
});
