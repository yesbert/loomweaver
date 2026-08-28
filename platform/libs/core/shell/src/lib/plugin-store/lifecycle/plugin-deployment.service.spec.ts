import { TestBed } from '@angular/core/testing';
import { PluginDeploymentService } from './plugin-deployment.service';
import { PluginCatalogEntry } from '../installed-plugin';

const STORAGE_KEY = 'lw.shell.deployed-plugins';

function entry(overrides: Partial<PluginCatalogEntry> = {}): PluginCatalogEntry {
  return {
    id: 'treaties',
    name: 'Treaties',
    entryUrl: '/treaties/plugin.html',
    capabilities: ['contributions'],
    deployed: true,
    ...overrides,
  };
}

describe('PluginDeploymentService', () => {
  afterEach(() => localStorage.clear());

  function service(): PluginDeploymentService {
    TestBed.configureTestingModule({});
    return TestBed.inject(PluginDeploymentService);
  }

  it('adopts only the entries the operator marked as deployed', () => {
    const deployment = service();

    deployment.adopt([
      entry(),
      entry({ id: 'offered', deployed: undefined }),
      entry({ id: 'also-offered', deployed: false }),
    ]);

    expect(deployment.deployed().map((plugin) => plugin.id)).toEqual([
      'treaties',
    ]);
  });

  it('drops the catalog-only metadata an entry carries for the store', () => {
    const deployment = service();

    deployment.adopt([entry({ description: 'A store blurb', author: 'Team A' })]);

    expect(deployment.deployed()[0]).toEqual({
      id: 'treaties',
      name: 'Treaties',
      entryUrl: '/treaties/plugin.html',
      capabilities: ['contributions'],
      version: undefined,
      iconUrl: undefined,
    });
  });

  it('a catalog that answers replaces the remembered set entirely', () => {
    const deployment = service();
    deployment.adopt([entry(), entry({ id: 'billing' })]);

    deployment.adopt([entry({ id: 'billing' })]);

    expect(deployment.deployed().map((plugin) => plugin.id)).toEqual([
      'billing',
    ]);
  });

  it('a catalog that answers with nothing deploys nothing', () => {
    const deployment = service();
    deployment.adopt([entry()]);

    deployment.adopt([]);

    expect(deployment.deployed()).toEqual([]);
  });

  it('remembers what it deployed, so a later start has it before the catalog answers', () => {
    service().adopt([entry()]);

    expect(localStorage.getItem(STORAGE_KEY)).toContain('treaties');

    TestBed.resetTestingModule();
    expect(service().deployed().map((plugin) => plugin.id)).toEqual([
      'treaties',
    ]);
  });

  it('leaves the remembered set alone while no catalog answers', () => {
    service().adopt([entry()]);
    TestBed.resetTestingModule();

    const deployment = service();

    expect(deployment.isDeployed('treaties')).toBe(true);
  });
});
