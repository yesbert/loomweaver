import { layout } from './app.config';

describe('layout', () => {
  it('declares the regions contributions target', () => {
    const ids = layout.regions.map((region) => region.id);
    for (const id of ['primary', 'left-panel', 'main', 'right-panel', 'status-bar']) {
      expect(ids).toContain(id);
    }
  });
});
