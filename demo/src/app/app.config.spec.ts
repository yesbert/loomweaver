import { layout } from './app.config';

describe('layout', () => {
  it('declares every region id a weaver targets, so editing the layout fails here instead of rendering nothing in the browser', () => {
    const ids = layout.regions.map((region) => region.id);
    for (const id of ['primary', 'secondary', 'left-panel', 'right-panel', 'main', 'status-bar']) {
      expect(ids).toContain(id);
    }
  });
});
