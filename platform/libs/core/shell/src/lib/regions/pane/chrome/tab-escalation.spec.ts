import { escalationStep } from './tab-escalation';
import { StripTab } from './strip-tab';

function tab(overrides: Partial<StripTab>): StripTab {
  return {
    path: 'doc/a',
    title: 'a',
    literalTitle: true,
    closable: true,
    preview: false,
    pinned: false,
    ...overrides,
  };
}

const on = { escalate: true, pin: true };

describe('escalationStep', () => {
  it('walks preview → keep → pin → unpin', () => {
    expect(escalationStep(tab({ preview: true }), on)).toBe('keep');
    expect(escalationStep(tab({}), on)).toBe('pin');
    expect(escalationStep(tab({ pinned: true }), on)).toBe('unpin');
  });

  it('does nothing for a view tab or with escalation switched off', () => {
    expect(
      escalationStep(tab({ path: 'view:outline', preview: true }), on),
    ).toBeNull();
    expect(
      escalationStep(tab({ preview: true }), { escalate: false, pin: true }),
    ).toBeNull();
  });

  it('keeps a preview but pins nothing with pinning switched off', () => {
    const noPin = { escalate: true, pin: false };
    expect(escalationStep(tab({ preview: true }), noPin)).toBe('keep');
    expect(escalationStep(tab({}), noPin)).toBeNull();
    expect(escalationStep(tab({ pinned: true }), noPin)).toBeNull();
  });

  it('does not pin a tab that cannot be closed', () => {
    expect(escalationStep(tab({ closable: false }), on)).toBeNull();
  });
});
