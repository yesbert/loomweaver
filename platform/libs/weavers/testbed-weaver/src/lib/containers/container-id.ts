import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export function containerIdFromRoute(): string {
  return inject(ActivatedRoute, { optional: true })?.snapshot.paramMap.get('id') ?? '—';
}
