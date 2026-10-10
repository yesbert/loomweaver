import { RaiserLimits } from '../../notifications/notification-board';

export const ISOLATED_NOTIFICATION_LIMITS: RaiserLimits = {
  atOnce: 3,
  lifetimeMs: 15_000,
};
