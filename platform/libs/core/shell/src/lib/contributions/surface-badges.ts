import { signal } from '@angular/core';
import { TabBadge } from '@loomweaver/plugin-sdk';

export class SurfaceBadges {
  private readonly badges = signal<ReadonlyMap<string, TabBadge>>(new Map());

  badgeOf(id: string | undefined): TabBadge | undefined {
    return id === undefined ? undefined : this.badges().get(id);
  }

  set(id: string, badge: TabBadge | undefined): void {
    this.badges.update((badges) => {
      if (JSON.stringify(badges.get(id)) === JSON.stringify(badge)) {
        return badges;
      }
      const next = new Map([...badges].filter(([key]) => key !== id));
      return badge === undefined ? next : next.set(id, badge);
    });
  }
}
