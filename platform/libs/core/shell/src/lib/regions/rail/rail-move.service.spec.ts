import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideLayout } from '../../layout/layout';
import { RailMoveService } from './rail-move.service';
import { RailItemsService } from './rail-items.service';

const twoRails = provideLayout({
  regions: [
    { id: 'activity', type: 'rail', dock: 'left' },
    { id: 'activity-right', type: 'rail', dock: 'right' },
    { id: 'main', type: 'content', dock: 'center' },
  ],
});

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        rail: {
          move: {
            announce: '{{item}} moved to {{target}}',
            targetLeft: 'left activity bar',
            targetRight: 'right activity bar',
          },
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function setup(layout = twoRails) {
  localStorage.clear();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [transloco()],
    providers: [layout],
  });
  return {
    moves: TestBed.inject(RailMoveService),
    railItems: TestBed.inject(RailItemsService),
  };
}

describe('RailMoveService', () => {
  it('moves an entry into the other rail', () => {
    const { moves, railItems } = setup();

    moves.move('settings', 'activity-right');

    expect(railItems.regionOf('settings', 'activity')).toBe('activity-right');
  });

  it('names the rail on the opposite side, and nothing when there is none', () => {
    const { moves } = setup();

    expect(moves.otherRail('activity')).toBe('activity-right');
    expect(moves.railOn('right', 'activity')).toBe('activity-right');
    expect(moves.railOn('left', 'activity')).toBeUndefined();
  });

  it('has no target in a layout with a single rail', () => {
    const { moves } = setup(
      provideLayout({
        regions: [
          { id: 'activity', type: 'rail', dock: 'left' },
          { id: 'main', type: 'content', dock: 'center' },
        ],
      }),
    );

    expect(moves.otherRail('activity')).toBeUndefined();
    expect(moves.railOn('right', 'activity')).toBeUndefined();
  });
});
