import type { PendingToolCall, ToolDecision } from './command-tools.js';

/** What the policy tells the agent when it declines a call, worded by the product where it wants to. */
export interface ConsentWording {
  /** Said for a command that is not to be run on an agent's word. */
  readonly never?: string;
  /** Said when the person answered no. */
  readonly refused?: string;
}

const NEVER = 'an agent may not run this one on its own word.';
const REFUSED = 'the person at the keyboard said no.';
const RUN: ToolDecision = { decision: 'run' };

/**
 * A `before` decision that acts on what each command states about an agent's word, for a product
 * that wants that rather than writing its own. Nothing applies it unless the product passes it to
 * {@link commandTools}.
 *
 * It declines a call to a command that is not to be run on an agent's word, lets through one whose
 * statement is that the word is enough or that says nothing, and puts the rest to the person through
 * `confirm`, the product's own way of asking. For a command that asks first, a yes is remembered for
 * as long as this policy is, so create one per connection; for a command that asks every time,
 * nothing is remembered. A no declines the call. Letting a call through widens nothing: the workbench
 * still refuses what it always refused.
 */
export function consentPolicy(
  confirm: (call: PendingToolCall) => Promise<boolean>,
  wording: ConsentWording = {},
): (call: PendingToolCall) => Promise<ToolDecision> {
  const allowed = new Set<string>();
  return async (call) => {
    const consent = call.agentConsent;
    if (consent === 'never') {
      return { decision: 'decline', reason: wording.never ?? NEVER };
    }
    if (consent !== 'ask' && consent !== 'ask-always') {
      return RUN;
    }
    if (consent === 'ask' && allowed.has(call.commandId)) {
      return RUN;
    }
    if (!(await confirm(call))) {
      return { decision: 'decline', reason: wording.refused ?? REFUSED };
    }
    if (consent === 'ask') {
      allowed.add(call.commandId);
    }
    return RUN;
  };
}
