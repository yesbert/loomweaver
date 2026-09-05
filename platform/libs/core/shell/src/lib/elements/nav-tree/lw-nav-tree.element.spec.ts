import { LW_NAV_GROUP_TAG } from './lw-nav-group.element';
import { LW_NAV_ITEM_TAG, LwNavItemElement } from './lw-nav-item.element';
import {
  LW_NAV_SELECT,
  LW_NAV_TREE_TAG,
  LwNavTreeElement,
  defineLwNavTree,
} from './lw-nav-tree.element';
import { forgetFolds } from './nav-fold-state';

defineLwNavTree();

function draw(markup: string): LwNavTreeElement {
  document.body.innerHTML = markup;
  return document.body.querySelector(LW_NAV_TREE_TAG) as LwNavTreeElement;
}

function items(root: ParentNode): LwNavItemElement[] {
  return [...root.querySelectorAll<LwNavItemElement>(LW_NAV_ITEM_TAG)];
}

function marked(tree: LwNavTreeElement): string[] {
  return items(tree)
    .filter((item) => item.getAttribute('aria-current') === 'page')
    .map((item) => item.path);
}

const SALES = `
  <lw-nav-tree current="sales/customers">
    <lw-nav-group label="Customers" key="sales/customers">
      <lw-nav-item path="sales/customers" label="Customer list" icon="quotes"></lw-nav-item>
      <lw-nav-item path="sales/contacts" label="Contact history"></lw-nav-item>
    </lw-nav-group>
    <lw-nav-group label="Order handling" key="sales/orders">
      <lw-nav-item path="sales/quotes" label="Quotes"></lw-nav-item>
    </lw-nav-group>
  </lw-nav-tree>`;

afterEach(() => {
  forgetFolds();
  document.body.replaceChildren();
});

describe('lw-nav-tree', () => {
  it('draws a group holding one destination as a group, not as a destination on its own', () => {
    const tree = draw(SALES);

    const groups = [...tree.querySelectorAll(LW_NAV_GROUP_TAG)];
    expect(groups).toHaveLength(2);
    expect(
      groups[1].querySelector('.lw-nav-group-label')?.textContent,
    ).toBe('Order handling');
    expect(items(groups[1])).toHaveLength(1);
  });

  it('draws a destination declared outside every group beside the groups', () => {
    const tree = draw(`
      <lw-nav-tree>
        <lw-nav-group label="Customers"><lw-nav-item path="a" label="A"></lw-nav-item></lw-nav-group>
        <lw-nav-item path="settings" label="Settings"></lw-nav-item>
      </lw-nav-tree>`);

    const loose = [...tree.children].filter(
      (child) => child.localName === LW_NAV_ITEM_TAG,
    );
    expect(loose).toHaveLength(1);
    expect((loose[0] as LwNavItemElement).path).toBe('settings');
  });

  it('reports the chosen destination and does nothing else', () => {
    const tree = draw(SALES);
    const chosen: string[] = [];
    tree.addEventListener(LW_NAV_SELECT, (event) => {
      chosen.push((event as CustomEvent<{ path: string }>).detail.path);
    });

    items(tree)[2].click();

    expect(chosen).toEqual(['sales/quotes']);
    expect(marked(tree)).toEqual(['sales/customers']);
  });

  it('is chosen from the keyboard as well as the pointer', () => {
    const tree = draw(SALES);
    const chosen: string[] = [];
    tree.addEventListener(LW_NAV_SELECT, (event) => {
      chosen.push((event as CustomEvent<{ path: string }>).detail.path);
    });

    items(tree)[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );

    expect(chosen).toEqual(['sales/contacts']);
  });

  it('draws the declaration again when a destination is added, removed or renamed', async () => {
    const tree = draw(SALES);
    tree.current = 'sales/returns';
    expect(marked(tree)).toEqual([]);

    const added = document.createElement(LW_NAV_ITEM_TAG) as LwNavItemElement;
    added.path = 'sales/returns';
    added.label = 'Returns';
    tree.append(added);
    await Promise.resolve();

    expect(added.textContent).toContain('Returns');
    expect(marked(tree)).toEqual(['sales/returns']);
  });

  it('leaves what the consumer wrote inside an item on the row, after the label', () => {
    const tree = draw(`
      <lw-nav-tree>
        <lw-nav-item path="sales/quotes" label="Quotes"><span class="badge">7</span></lw-nav-item>
      </lw-nav-tree>`);

    const item = items(tree)[0];
    expect(item.querySelector('.badge')?.textContent).toBe('7');
    expect(item.textContent).toBe('Quotes7');
  });

  it('translates nothing it is given', () => {
    const tree = draw(
      `<lw-nav-tree><lw-nav-item path="a" label="nav.quotes"></lw-nav-item></lw-nav-tree>`,
    );

    expect(items(tree)[0].textContent).toBe('nav.quotes');
  });
});

describe('lw-nav-tree marking', () => {
  it('marks the destination a deeper address lies under', () => {
    const tree = draw(SALES);
    tree.current = 'sales/quotes/q-0006';

    expect(marked(tree)).toEqual(['sales/quotes']);
  });

  it('does not mark a destination whose address merely starts the same way', () => {
    const tree = draw(SALES);
    tree.current = 'sales/quotesomething';

    expect(marked(tree)).toEqual([]);
  });

  it('marks the destination whose address is shown exactly', () => {
    const tree = draw(SALES);
    tree.current = 'sales/contacts';

    expect(marked(tree)).toEqual(['sales/contacts']);
  });

  it('marks nothing when the address lies under no destination', () => {
    const tree = draw(SALES);
    tree.current = 'finance/matching';

    expect(marked(tree)).toEqual([]);
  });

  it('marks nothing when no address is shown', () => {
    const tree = draw(SALES);
    tree.current = null;

    expect(marked(tree)).toEqual([]);
  });

  it('marks one destination only, the longest that matches', () => {
    const tree = draw(`
      <lw-nav-tree current="sales/quotes/q-0006">
        <lw-nav-item path="sales" label="Sales"></lw-nav-item>
        <lw-nav-item path="sales/quotes" label="Quotes"></lw-nav-item>
      </lw-nav-tree>`);

    expect(marked(tree)).toEqual(['sales/quotes']);
  });

  it('moves the marking when the address moves', () => {
    const tree = draw(SALES);
    expect(marked(tree)).toEqual(['sales/customers']);

    tree.current = 'sales/quotes';

    expect(marked(tree)).toEqual(['sales/quotes']);
  });

  it('marks for assistive technology, not by appearance alone', () => {
    const tree = draw(SALES);

    expect(items(tree)[0].getAttribute('aria-current')).toBe('page');
    expect(tree.getAttribute('role')).toBe('navigation');
  });

  it('leaves a nested tree its own destinations', () => {
    const outer = draw(`
      <lw-nav-tree current="a/b">
        <lw-nav-item path="a" label="A"></lw-nav-item>
        <lw-nav-tree current="a/b"><lw-nav-item path="a/b" label="B"></lw-nav-item></lw-nav-tree>
      </lw-nav-tree>`);

    const own = [...outer.children].filter(
      (child) => child.localName === LW_NAV_ITEM_TAG,
    ) as LwNavItemElement[];
    expect(own[0].getAttribute('aria-current')).toBe('page');
  });
});

describe('lw-nav-tree folding', () => {
  it('starts a group shut where the declaration says so', () => {
    const tree = draw(`
      <lw-nav-tree>
        <lw-nav-group label="Matching" key="finance/matching" collapsed>
          <lw-nav-item path="finance/matching" label="Payment matching"></lw-nav-item>
        </lw-nav-group>
      </lw-nav-tree>`);

    const group = tree.querySelector(LW_NAV_GROUP_TAG) as HTMLElement;
    expect(group.dataset['open']).toBe('false');
    expect(
      group.querySelector('.lw-nav-group-heading')?.getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('starts a group open where the declaration says nothing', () => {
    const tree = draw(SALES);

    const group = tree.querySelector(LW_NAV_GROUP_TAG) as HTMLElement;
    expect(group.dataset['open']).toBe('true');
    expect(
      group.querySelector('.lw-nav-group-heading')?.getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('folds shut and open again when the user asks', () => {
    const tree = draw(SALES);
    const group = tree.querySelector(LW_NAV_GROUP_TAG) as HTMLElement;
    const heading = group.querySelector(
      '.lw-nav-group-heading',
    ) as HTMLButtonElement;

    heading.click();
    expect(group.dataset['open']).toBe('false');

    heading.click();
    expect(group.dataset['open']).toBe('true');
  });

  it('keeps what the user folded when the tree leaves the screen and is drawn again', () => {
    const first = draw(SALES);
    (
      first.querySelector('.lw-nav-group-heading') as HTMLButtonElement
    ).click();

    const second = draw(SALES);

    const group = second.querySelector(LW_NAV_GROUP_TAG) as HTMLElement;
    expect(group.dataset['open']).toBe('false');
  });

  it('starts from the declaration again once the session is gone', () => {
    const first = draw(SALES);
    (
      first.querySelector('.lw-nav-group-heading') as HTMLButtonElement
    ).click();

    forgetFolds();
    const second = draw(SALES);

    const group = second.querySelector(LW_NAV_GROUP_TAG) as HTMLElement;
    expect(group.dataset['open']).toBe('true');
  });

  it('keeps folds apart by the key the consumer gave', () => {
    const tree = draw(SALES);
    const groups = [...tree.querySelectorAll<HTMLElement>(LW_NAV_GROUP_TAG)];

    (
      groups[0].querySelector('.lw-nav-group-heading') as HTMLButtonElement
    ).click();

    expect(groups[0].dataset['open']).toBe('false');
    expect(groups[1].dataset['open']).toBe('true');
  });
});
