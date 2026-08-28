import {
  hasIcon,
  removeIcon,
  resolveIcon,
  sanitizeIconSvg,
  setIcon,
} from './icon-registry-global';

describe('icon-registry-global', () => {
  const NAME = '__spec_icon__';
  afterEach(() => removeIcon(NAME));

  describe('sanitizeIconSvg — the security seam (contributed SVG renders as raw innerHTML)', () => {
    it('keeps a plain svg intact', () => {
      const out = sanitizeIconSvg(
        '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>',
      );
      expect(out).toContain('<svg');
      expect(out).toContain('<path');
    });

    it('strips a <script> element', () => {
      const out = sanitizeIconSvg(
        '<svg><script>alert(1)</script><path d="M0 0"/></svg>',
      );
      expect(out).not.toContain('<script');
      expect(out.toLowerCase()).not.toContain('alert');
    });

    it('strips inline event handlers', () => {
      const out = sanitizeIconSvg(
        '<svg><path d="M0 0" onload="alert(1)"/></svg>',
      );
      expect(out.toLowerCase()).not.toContain('onload');
    });

    it('strips javascript: hrefs', () => {
      const out = sanitizeIconSvg(
        '<svg><a href="javascript:alert(1)"><path/></a></svg>',
      );
      expect(out.toLowerCase()).not.toContain('javascript:');
    });
  });

  describe('registry set / resolve / has / remove', () => {
    it('stores a name and resolves it back', () => {
      expect(hasIcon(NAME)).toBe(false);
      setIcon(NAME, '<svg/>');
      expect(hasIcon(NAME)).toBe(true);
      expect(resolveIcon(NAME)).toBe('<svg/>');
    });

    it('resolves an unknown name to undefined', () => {
      expect(resolveIcon('__no_such_icon__')).toBeUndefined();
    });

    it('removes a contributed name', () => {
      setIcon(NAME, '<svg/>');
      removeIcon(NAME);
      expect(hasIcon(NAME)).toBe(false);
      expect(resolveIcon(NAME)).toBeUndefined();
    });

    it('is seeded with the first-party icon set at load', () => {
      expect(hasIcon('settings')).toBe(true);
    });
  });
});
