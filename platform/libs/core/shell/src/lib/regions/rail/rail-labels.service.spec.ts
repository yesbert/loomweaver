import { TestBed } from '@angular/core/testing';
import { RailLabelsService } from './rail-labels.service';

describe('RailLabelsService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts with every rail unlabelled', () => {
    const labels = TestBed.inject(RailLabelsService);

    expect(labels.isLabelled('activity')).toBe(false);
    expect(labels.isLabelled('activity-right')).toBe(false);
  });

  it('leaves the other rail alone', () => {
    const labels = TestBed.inject(RailLabelsService);

    labels.setLabelled('activity', true);

    expect(labels.isLabelled('activity')).toBe(true);
    expect(labels.isLabelled('activity-right')).toBe(false);
  });

  it('turns a rail back off', () => {
    const labels = TestBed.inject(RailLabelsService);

    labels.setLabelled('activity', true);
    labels.setLabelled('activity', false);

    expect(labels.isLabelled('activity')).toBe(false);
  });

  it('persists across reloads', () => {
    TestBed.inject(RailLabelsService).setLabelled('activity-right', true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(TestBed.inject(RailLabelsService).isLabelled('activity-right')).toBe(
      true,
    );
  });

  it('ignores a corrupted persisted payload', () => {
    localStorage.setItem('lw.shell.rail-labels', '["not", "a", "map"]');

    expect(TestBed.inject(RailLabelsService).isLabelled('activity')).toBe(
      false,
    );
  });

  it('ignores a stored value that is not a choice', () => {
    localStorage.setItem('lw.shell.rail-labels', '{"activity":"yes"}');

    expect(TestBed.inject(RailLabelsService).isLabelled('activity')).toBe(
      false,
    );
  });
});
