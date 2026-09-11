import { describe, expect, it } from 'vitest';
import { carriedForm, drawingForm } from './picture-form';

describe('drawingForm', () => {
  it('carries it losslessly when nothing is asked for', () => {
    expect(drawingForm(undefined)).toEqual({
      mediaType: 'image/png',
      quality: undefined,
    });
    expect(drawingForm('lossless').mediaType).toBe('image/png');
  });

  it('names the compressed form and how strongly', () => {
    expect(drawingForm({ compressed: 'jpeg', quality: 0.5 })).toEqual({
      mediaType: 'image/jpeg',
      quality: 0.5,
    });
    expect(drawingForm({ compressed: 'webp' })).toEqual({
      mediaType: 'image/webp',
      quality: 0.8,
    });
  });

  it('brings a strength outside 0 to 1 within it', () => {
    expect(drawingForm({ compressed: 'jpeg', quality: 9 }).quality).toBe(1);
    expect(drawingForm({ compressed: 'jpeg', quality: -1 }).quality).toBe(0);
    expect(drawingForm({ compressed: 'jpeg', quality: NaN }).quality).toBe(0.8);
  });
});

describe('carriedForm', () => {
  it.each([
    ['data:image/png;base64,AA==', 'lossless'],
    ['data:image/jpeg;base64,AA==', 'jpeg'],
    ['data:image/webp;base64,AA==', 'webp'],
    ['', 'lossless'],
    ['data:image/gif;base64,AA==', 'lossless'],
  ])('reads %s back as %s', (image, expected) => {
    expect(carriedForm(image)).toBe(expected);
  });
});
