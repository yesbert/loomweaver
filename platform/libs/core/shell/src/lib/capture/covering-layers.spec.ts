import { afterEach, describe, expect, it } from 'vitest';
import { paintPlan, Placed } from './covering-layers';

interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const SURFACE: Box = { left: 100, top: 100, width: 400, height: 300 };

const WINDOW: Box = { left: 0, top: 0, width: 1440, height: 860 };

function placed(element: HTMLElement, box: Box): HTMLElement {
  element.getBoundingClientRect = () =>
    ({
      ...box,
      right: box.left + box.width,
      bottom: box.top + box.height,
    }) as DOMRect;
  return element;
}

function fixed(box: Box, zIndex = 'auto'): HTMLElement {
  const element = placed(document.createElement('div'), box);
  element.style.position = 'fixed';
  element.style.zIndex = zIndex;
  return element;
}

function surface(box: Box = SURFACE): Placed & { element: HTMLElement } {
  const element = placed(document.createElement('iframe'), box);
  return { element, rect: element.getBoundingClientRect() };
}

function coversOf(surfaces: readonly Placed[]): Element[] {
  const view = globalThis as unknown as Window;
  return paintPlan(document.body, surfaces, view).passes.flatMap((pass) =>
    pass.covers.length > 0 ? [pass.layer.element] : [],
  );
}

describe('what is drawn again over a surface', () => {
  afterEach(() => document.body.replaceChildren());

  it('leaves out a background fixed beneath the workbench', () => {
    const background = fixed(WINDOW, '-1');
    const pane = surface();
    document.body.append(background, pane.element);

    expect(coversOf([pane])).toEqual([]);
  });

  it('leaves out a fixed element stacked beneath the surface it overlaps', () => {
    const banner = fixed(WINDOW, '1');
    const host = document.createElement('div');
    host.style.position = 'relative';
    host.style.zIndex = '5';
    const pane = surface();
    host.append(pane.element);
    document.body.append(banner, host);

    expect(coversOf([pane])).toEqual([]);
  });

  it('leaves out a fixed element that comes before a surface on the same level', () => {
    const banner = fixed(WINDOW);
    const host = document.createElement('div');
    host.style.position = 'relative';
    const pane = surface();
    host.append(pane.element);
    document.body.append(banner, host);

    expect(coversOf([pane])).toEqual([]);
  });

  it('draws a fixed element that comes after a surface on the same level', () => {
    const host = document.createElement('div');
    host.style.position = 'relative';
    const pane = surface();
    host.append(pane.element);
    const toast = fixed(WINDOW);
    document.body.append(host, toast);

    expect(coversOf([pane])).toEqual([toast]);
  });

  it('draws an open submenu that lies outside the menu holding it', () => {
    const pane = surface();
    const menu = fixed({ left: 600, top: 50, width: 180, height: 120 }, '50');
    const item = document.createElement('div');
    const submenu = fixed({ left: 300, top: 150, width: 180, height: 120 });
    item.append(submenu);
    menu.append(item);
    document.body.append(pane.element, menu);

    expect(coversOf([pane])).toEqual([submenu]);
  });

  it('draws a fixed element that lives in an open shadow root', () => {
    const pane = surface();
    const host = document.createElement('div');
    const tooltip = fixed({ left: 150, top: 150, width: 120, height: 40 }, '60');
    host.attachShadow({ mode: 'open' }).append(tooltip);
    document.body.append(pane.element, host);

    expect(coversOf([pane])).toEqual([tooltip]);
  });
});
