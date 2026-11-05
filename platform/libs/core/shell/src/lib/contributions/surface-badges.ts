import { signal } from '@angular/core';
import { TabBadge } from '@loomweaver/plugin-sdk';

interface OwnedBadge {
  readonly id: string;
  readonly ownerId: string | undefined;
  readonly badge: TabBadge;
}

export class SurfaceBadges {
  private readonly badges = signal<readonly OwnedBadge[]>([]);

  badgeOf(
    id: string | undefined,
    ownerId: string | undefined,
  ): TabBadge | undefined {
    const ofId = this.badges().filter((held) => held.id === id);
    const exact = ofId.find((held) => held.ownerId === ownerId);
    return (exact ?? (ownerId === undefined ? ofId[0] : undefined))?.badge;
  }

  set(
    id: string,
    ownerId: string | undefined,
    badge: TabBadge | undefined,
  ): void {
    this.badges.update((badges) => {
      const current = badges.find(
        (held) => held.id === id && held.ownerId === ownerId,
      );
      if (JSON.stringify(current?.badge) === JSON.stringify(badge)) {
        return badges;
      }
      const others = badges.filter((held) => held !== current);
      return badge === undefined ? others : [...others, { id, ownerId, badge }];
    });
  }

  forgetUnless(
    registered: (id: string, ownerId: string | undefined) => boolean,
  ): void {
    this.badges.update((badges) =>
      badges.every((held) => registered(held.id, held.ownerId))
        ? badges
        : badges.filter((held) => registered(held.id, held.ownerId)),
    );
  }
}
