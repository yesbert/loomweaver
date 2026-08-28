import { PaneChromeService } from './pane-chrome.service';

describe('PaneChromeService', () => {
  let chrome: PaneChromeService;

  beforeEach(() => {
    chrome = new PaneChromeService();
  });

  describe('maximize', () => {
    it('has no maximized pane initially', () => {
      expect(chrome.isMaximized('content', 'a')).toBe(false);
      expect(chrome.maximizedPaneIn('content')).toBeNull();
    });

    it('toggles a pane maximized and back', () => {
      chrome.toggleMaximize('content', 'a');
      expect(chrome.isMaximized('content', 'a')).toBe(true);
      expect(chrome.maximizedPaneIn('content')).toBe('a');

      chrome.toggleMaximize('content', 'a');
      expect(chrome.isMaximized('content', 'a')).toBe(false);
      expect(chrome.maximizedPaneIn('content')).toBeNull();
    });

    it('maximizing another pane replaces the current one', () => {
      chrome.toggleMaximize('content', 'a');
      chrome.toggleMaximize('content', 'b');
      expect(chrome.isMaximized('content', 'a')).toBe(false);
      expect(chrome.isMaximized('content', 'b')).toBe(true);
    });

    it('scopes the maximized pane to its dock', () => {
      chrome.toggleMaximize('content', 'a');
      expect(chrome.maximizedPaneIn('content')).toBe('a');
      expect(chrome.maximizedPaneIn('left')).toBeNull();
      expect(chrome.isMaximized('left', 'a')).toBe(false);
    });

    it('restore clears any maximized pane', () => {
      chrome.toggleMaximize('content', 'a');
      chrome.restore();
      expect(chrome.maximizedPaneIn('content')).toBeNull();
    });
  });

  describe('minimize', () => {
    it('toggles a pane minimized and back', () => {
      expect(chrome.isMinimized('content', 'a')).toBe(false);
      chrome.toggleMinimize('content', 'a');
      expect(chrome.isMinimized('content', 'a')).toBe(true);
      chrome.toggleMinimize('content', 'a');
      expect(chrome.isMinimized('content', 'a')).toBe(false);
    });

    it('tracks several minimized panes independently', () => {
      chrome.toggleMinimize('content', 'a');
      chrome.toggleMinimize('content', 'b');
      expect(chrome.isMinimized('content', 'a')).toBe(true);
      expect(chrome.isMinimized('content', 'b')).toBe(true);
    });

    it('distinguishes the same pane id across docks', () => {
      chrome.toggleMinimize('content', 'a');
      expect(chrome.isMinimized('content', 'a')).toBe(true);
      expect(chrome.isMinimized('left', 'a')).toBe(false);
    });

    it('clearMinimized removes only the given dock', () => {
      chrome.toggleMinimize('content', 'a');
      chrome.toggleMinimize('left', 'b');
      chrome.clearMinimized('content');
      expect(chrome.isMinimized('content', 'a')).toBe(false);
      expect(chrome.isMinimized('left', 'b')).toBe(true);
    });

    it('clearMinimized is a no-op when the dock has nothing minimized', () => {
      chrome.toggleMinimize('content', 'a');
      const before = chrome.isMinimized('content', 'a');
      chrome.clearMinimized('left');
      expect(chrome.isMinimized('content', 'a')).toBe(before);
    });
  });
});
