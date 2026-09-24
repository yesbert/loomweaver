export interface FeedbackColors {
  readonly text: string;
  readonly tint: string;
}

export const FEEDBACK_COLORS = {
  info: { text: 'text-info', tint: 'bg-info/10' },
  success: { text: 'text-positive', tint: 'bg-positive/10' },
  warning: { text: 'text-caution', tint: 'bg-caution/10' },
  negative: { text: 'text-negative', tint: 'bg-negative/10' },
} as const satisfies Record<string, FeedbackColors>;
