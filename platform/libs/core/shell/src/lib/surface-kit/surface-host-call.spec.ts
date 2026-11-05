import { quietly } from './surface-host-call';

describe('a call from a surface to the workbench', () => {
  it('is reported as failed with its reason, whatever the reason, and never as refused', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const lost = new Error('the connection was closed');

    quietly(Promise.reject(lost));
    quietly(Promise.resolve('answered'));
    quietly(undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('failed'), lost);
    expect(warn.mock.calls[0][0]).not.toContain('refused');
    warn.mockRestore();
  });
});
