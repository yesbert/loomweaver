export interface FeedbackColors {
  readonly text: string;
  readonly tint: string;
  readonly edge: string;
}

export const FEEDBACK_COLORS = {
  info: { text: 'text-info', tint: 'bg-info/10', edge: 'border-info/40' },
  success: {
    text: 'text-positive',
    tint: 'bg-positive/10',
    edge: 'border-positive/40',
  },
  warning: {
    text: 'text-caution',
    tint: 'bg-caution/10',
    edge: 'border-caution/40',
  },
  negative: {
    text: 'text-negative',
    tint: 'bg-negative/10',
    edge: 'border-negative/40',
  },
} as const satisfies Record<string, FeedbackColors>;
