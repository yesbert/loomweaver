import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { NotificationService } from '../../../notifications/notification.service';
import { SaveOnHide } from './save-on-hide';

@Component({ template: '' })
class NotesView {}

const ROUTES: readonly ContentRoute[] = [
  { path: 'notes', component: NotesView, saveOn: 'hide' },
];

function surfaceSaving(save: () => unknown): object {
  return { surfaceDirty: () => true, surfaceSave: save };
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('SaveOnHide when the save does not keep its promise', () => {
  beforeEach(() =>
    vi.spyOn(console, 'error').mockImplementation(() => undefined),
  );
  afterEach(() => vi.restoreAllMocks());

  const cases: readonly [string, () => unknown][] = [
    [
      'throws before it returns',
      () => {
        throw new Error('disk full');
      },
    ],
    ['returns no promise', () => undefined],
  ];

  for (const [what, save] of cases) {
    it(`reports a save that ${what}, and the caller goes on`, async () => {
      const saving = TestBed.inject(SaveOnHide);

      expect(() =>
        saving.saveOnce(surfaceSaving(save), 'notes', ROUTES, []),
      ).not.toThrow();
      await settle();

      expect(TestBed.inject(NotificationService).notifications()).toMatchObject(
        [{ message: 'retention.saveFailed', kind: 'error' }],
      );
    });
  }
});
