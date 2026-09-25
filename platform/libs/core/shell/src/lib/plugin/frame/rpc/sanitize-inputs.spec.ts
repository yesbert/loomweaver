import {
  MenuItem,
  NotificationInput,
  OpenTabInput,
} from '@loomweaver/plugin-sdk';
import {
  sanitizeRpcMenuItem,
  sanitizeRpcTabInput,
  sanitizeRpcTabLabel,
  sanitizeRpcToastInput,
} from './sanitize-inputs';

function asTabInput(raw: unknown): OpenTabInput {
  return raw as OpenTabInput;
}

function asMenuItem(raw: unknown): MenuItem {
  return raw as MenuItem;
}

describe('sanitizeRpcTabInput', () => {
  it('keeps the plain fields and carries titleIsLiteral + preview through', () => {
    const input = sanitizeRpcTabInput(
      asTabInput({
        path: 'doc/a',
        title: 'A.ts',
        icon: 'testbedDocument',
        titleIsLiteral: true,
        preview: true,
      }),
    );

    expect(input).toEqual({
      path: 'doc/a',
      title: 'A.ts',
      icon: 'testbedDocument',
      titleIsLiteral: true,
      preview: true,
    });
  });

  it('drops a proxied onClose function so no host-side callback crosses the wire', () => {
    const input = sanitizeRpcTabInput(
      asTabInput({ path: 'doc/a', title: 'A.ts', onClose: () => 'nope' }),
    );

    expect('onClose' in input).toBe(false);
  });

  it('defaults a missing title to the path and rejects a missing path', () => {
    expect(sanitizeRpcTabInput(asTabInput({ path: 'doc/a' })).title).toBe(
      'doc/a',
    );
    expect(() => sanitizeRpcTabInput(asTabInput({ title: 'x' }))).toThrow(
      /path/,
    );
  });
});

describe('sanitizeRpcToastInput', () => {
  const asToast = (raw: object) => raw as NotificationInput;

  it('rebuilds a literal from the known fields and drops junk shapes', () => {
    const input = sanitizeRpcToastInput(
      asToast({
        message: 'hello',
        kind: 'success',
        timeoutMs: 2000,
        id: 'greet',
        action: { label: 'x', run: () => 'nope' },
        extra: { nested: true },
      }),
    );

    expect(input).toEqual({
      message: 'hello',
      kind: 'success',
      timeoutMs: 2000,
      id: 'greet',
    });
    expect('action' in input).toBe(false);
  });

  it('drops an unknown kind and a non-finite timeout', () => {
    const input = sanitizeRpcToastInput(
      asToast({ message: 'm', kind: 'shiny', timeoutMs: NaN }),
    );

    expect(input.kind).toBeUndefined();
    expect(input.timeoutMs).toBeUndefined();
  });

  it('rejects a missing or empty message', () => {
    expect(() => sanitizeRpcToastInput(asToast({}))).toThrow(/message/);
    expect(() => sanitizeRpcToastInput(asToast({ message: '' }))).toThrow(
      /message/,
    );
  });
});

describe('sanitizeRpcMenuItem', () => {
  it('rebuilds a menu item from plain fields and drops an inline run function', () => {
    const item = sanitizeRpcMenuItem(
      asMenuItem({
        menu: 'content/tab/context',
        command: 'testbed.tab.reveal',
        order: 0,
        when: { closable: true, extra: { nested: 1 } },
        run: () => 'nope',
      }),
    );

    expect(item).toEqual({
      menu: 'content/tab/context',
      command: 'testbed.tab.reveal',
      title: undefined,
      order: 0,
      when: { closable: true },
    });
    expect('run' in item).toBe(false);
  });

  it('rejects a missing or empty menu slot', () => {
    expect(() => sanitizeRpcMenuItem(asMenuItem({ command: 'x' }))).toThrow(
      /menu/,
    );
    expect(() =>
      sanitizeRpcMenuItem(asMenuItem({ menu: '', command: 'x' })),
    ).toThrow(/menu/);
  });

  it('passes id and checkedWhen through as plain data', () => {
    const item = sanitizeRpcMenuItem(
      asMenuItem({
        id: 'menu:shell.tab.close',
        menu: 'content/tab/context',
        command: 'x',
        checkedWhen: { pinned: true },
      }),
    );
    expect(item.id).toBe('menu:shell.tab.close');
    expect(item.checkedWhen).toEqual({ pinned: true });

    const noId = sanitizeRpcMenuItem(
      asMenuItem({ menu: 'content/tab/context', command: 'x', id: 42 }),
    );
    expect(noId.id).toBeUndefined();
  });
});

describe('sanitizeRpcTabLabel — a tab label across the seam', () => {
  it('keeps the known fields and drops the rest', () => {
    expect(
      sanitizeRpcTabLabel({
        title: 'Q-0004',
        titleIsLiteral: true,
        icon: 'quotes',
        badge: { text: 'Sent', textIsLiteral: true, tone: 'brand' },
        extra: 'dropped',
      } as never),
    ).toEqual({
      title: 'Q-0004',
      titleIsLiteral: true,
      icon: 'quotes',
      badge: { text: 'Sent', textIsLiteral: true, tone: 'brand' },
    });
  });

  it('passes a null badge through, so it takes the badge away', () => {
    expect(sanitizeRpcTabLabel({ badge: null })).toEqual({ badge: null });
  });

  it('leaves a malformed badge and a non-string title out, so they change nothing', () => {
    expect(
      sanitizeRpcTabLabel({ title: 7, badge: { tone: 'loud' } } as never),
    ).toEqual({});
  });
});
