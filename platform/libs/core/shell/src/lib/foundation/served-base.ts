import { APP_BASE_HREF, Location, PlatformLocation } from '@angular/common';
import { inject, Service } from '@angular/core';

@Service()
export class ServedBase {
  private readonly href =
    inject(APP_BASE_HREF, { optional: true }) ||
    inject(PlatformLocation).getBaseHrefFromDOM() ||
    '/';
  private readonly prefix = Location.stripTrailingSlash(this.href);

  under(path: string): string {
    return Location.joinWithSlash(this.href, path);
  }

  below(pathname: string): string {
    const within =
      this.prefix !== '' &&
      (pathname === this.prefix || pathname.startsWith(`${this.prefix}/`));
    return within ? pathname.slice(this.prefix.length) : pathname;
  }
}
