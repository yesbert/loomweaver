import { layout } from './app.config';

describe('layout', () => {
  it('declares every region id a weaver targets, so editing the layout fails here instead of rendering nothing in the browser', () => {
    const ids = layout.regions.map((region) => region.id);
    for (const id of ['primary', 'status-bar', 'main']) {
      expect(ids).toContain(id);
    }
  });
});
