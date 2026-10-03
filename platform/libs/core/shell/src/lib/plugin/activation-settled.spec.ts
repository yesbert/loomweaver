import { ActivationSettled } from './activation-settled';

describe('ActivationSettled', () => {
  it('is settled at once when nothing was handed in', async () => {
    const settled = new ActivationSettled();

    await expect(settled.settled()).resolves.toBeUndefined();
  });

  it('waits for tracked work, whether it resolves or rejects', async () => {
    const settled = new ActivationSettled();
    let finishOne: () => void = () => undefined;
    let failTwo: (error: unknown) => void = () => undefined;
    settled.track(new Promise<void>((resolve) => (finishOne = resolve)));
    settled.track(new Promise<void>((_, reject) => (failTwo = reject)));
    let done = false;
    void settled.settled().then(() => (done = true));

    finishOne();
    await Promise.resolve();
    expect(done).toBe(false);

    failTwo(new Error('no'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(done).toBe(true);
  });

  it('also waits for work handed in while it was already waiting', async () => {
    const settled = new ActivationSettled();
    let finishFirst: () => void = () => undefined;
    let finishLater: () => void = () => undefined;
    settled.track(new Promise<void>((resolve) => (finishFirst = resolve)));
    let done = false;
    void settled.settled().then(() => (done = true));

    settled.track(new Promise<void>((resolve) => (finishLater = resolve)));
    finishFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(done).toBe(false);

    finishLater();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(done).toBe(true);
  });
});
