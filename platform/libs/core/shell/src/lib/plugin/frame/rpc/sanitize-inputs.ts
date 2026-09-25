import {
  ContentTabLabel,
  MenuContext,
  MenuItem,
  NotificationInput,
  NotificationKind,
  OpenTabInput,
} from '@loomweaver/plugin-sdk';
import { tabBadgeOf } from '../../../contributions/tab-badge';
import {
  isWireObject,
  onlyTrue,
  optionalNumber,
  optionalText,
  requiredText,
  wireRecord,
} from './wire-fields';

const NOTIFICATION_KINDS = new Set<NotificationKind>([
  'info',
  'success',
  'warning',
  'error',
]);

export function sanitizeRpcTabInput(input: OpenTabInput): OpenTabInput {
  const raw = wireRecord(input);
  const path = requiredText(
    raw['path'],
    'Sandbox plugin: openContentTab requires a non-empty string path.',
  );
  return {
    path,
    title: optionalText(raw['title']) ?? path,
    titleIsLiteral: onlyTrue(raw['titleIsLiteral']),
    icon: optionalText(raw['icon']),
    preview: onlyTrue(raw['preview']),
    badge: raw['badge'] === null ? null : tabBadgeOf(raw['badge']),
  };
}

export function sanitizeRpcTabLabel(label: ContentTabLabel): ContentTabLabel {
  const raw = wireRecord(label);
  const badge = raw['badge'] === null ? null : tabBadgeOf(raw['badge']);
  return {
    ...(typeof raw['title'] === 'string' && {
      title: raw['title'],
      titleIsLiteral: raw['titleIsLiteral'] === true,
    }),
    ...(typeof raw['icon'] === 'string' && { icon: raw['icon'] }),
    ...(badge !== undefined && { badge }),
  };
}

export function sanitizeRpcToastInput(
  input: NotificationInput,
): NotificationInput {
  const raw = wireRecord(input);
  const timeoutMs = optionalNumber(raw['timeoutMs']);
  return {
    message: requiredText(
      raw['message'],
      'Sandbox plugin: toast requires a non-empty string message.',
    ),
    kind: isNotificationKind(raw['kind']) ? raw['kind'] : undefined,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : undefined,
    id: optionalText(raw['id']),
  };
}

export function sanitizeRpcMenuItem(item: MenuItem): MenuItem {
  const raw = wireRecord(item);
  return {
    id: optionalText(raw['id']),
    menu: requiredText(
      raw['menu'],
      'Sandbox plugin: registerMenuItem requires a non-empty string menu slot.',
    ),
    command: optionalText(raw['command']),
    title: optionalText(raw['title']),
    group: optionalText(raw['group']),
    order: optionalNumber(raw['order']),
    when: sanitizeMenuContext(raw['when']),
    checkedWhen: sanitizeMenuContext(raw['checkedWhen']),
  };
}

function isNotificationKind(value: unknown): value is NotificationKind {
  return NOTIFICATION_KINDS.has(value as NotificationKind);
}

function sanitizeMenuContext(value: unknown): MenuContext | undefined {
  if (!isWireObject(value)) {
    return undefined;
  }
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (
      typeof raw === 'string' ||
      typeof raw === 'number' ||
      typeof raw === 'boolean'
    ) {
      clean[key] = raw;
    }
  }
  return clean;
}
