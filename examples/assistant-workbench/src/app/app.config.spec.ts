import { layout } from './app.config';

describe('layout', () => {
  it('declares the regions contributions target', () => {
    const ids = layout.regions.map((region) => region.id);
    for (const id of ['primary', 'status-bar', 'main', 'right-panel']) {
      expect(ids).toContain(id);
    }
  });
});
