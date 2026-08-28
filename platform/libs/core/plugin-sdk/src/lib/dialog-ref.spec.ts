import { DialogRef } from './dialog-ref.js';

describe('DialogRef', () => {
  it('exposes the data it was constructed with (undefined by default)', () => {
    expect(new DialogRef().data).toBeUndefined();
    expect(new DialogRef({ id: 7 }).data).toEqual({ id: 7 });
  });

  it('resolves closed with the result', async () => {
    const ref = new DialogRef<string>();
    ref.close('ok');
    await expect(ref.closed).resolves.toBe('ok');
  });

  it('resolves undefined when dismissed without a result', async () => {
    const ref = new DialogRef();
    ref.close();
    await expect(ref.closed).resolves.toBeUndefined();
  });

  it('is idempotent — later close calls are ignored', async () => {
    const ref = new DialogRef<string>();
    ref.close('first');
    ref.close('second');
    await expect(ref.closed).resolves.toBe('first');
  });
});
