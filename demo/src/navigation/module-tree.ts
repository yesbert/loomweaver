export interface ModuleView {
  readonly titleKey: string;
  readonly path: string;
  readonly icon: string;
}

export interface ModuleArea {
  readonly id: string;
  readonly titleKey: string;
  readonly views: readonly ModuleView[];
  readonly expanded?: boolean;
}

export interface ProductModule {
  readonly id: string;
  readonly titleKey: string;
  readonly icon: string;
  readonly prefix: string;
  readonly landing: string | null;
  readonly areas: readonly ModuleArea[];
}

export const MODULES: readonly ProductModule[] = [
  {
    id: 'overview',
    titleKey: 'product.module.overview',
    icon: 'overview',
    prefix: '',
    landing: null,
    areas: [],
  },
  {
    id: 'sales',
    titleKey: 'product.module.sales',
    icon: 'sales',
    prefix: 'sales',
    landing: 'sales/customers',
    areas: [
      {
        id: 'customers',
        titleKey: 'product.area.customers',
        views: [
          { titleKey: 'product.view.customerList', path: 'sales/customers', icon: 'customerList' },
          { titleKey: 'product.view.contactHistory', path: 'sales/contacts', icon: 'contactHistory' },
        ],
      },
      {
        id: 'orderHandling',
        titleKey: 'product.area.orderHandling',
        views: [{ titleKey: 'product.view.quotes', path: 'sales/quotes', icon: 'quotes' }],
      },
    ],
  },
  {
    id: 'finance',
    titleKey: 'product.module.finance',
    icon: 'finance',
    prefix: 'finance',
    landing: 'finance/matching',
    areas: [
      { id: 'receivables', titleKey: 'product.area.receivables', views: [] },
      { id: 'payables', titleKey: 'product.area.payables', views: [] },
      {
        id: 'matching',
        titleKey: 'product.area.matching',
        expanded: false,
        views: [
          {
            titleKey: 'product.view.paymentMatching',
            path: 'finance/matching',
            icon: 'paymentMatching',
          },
        ],
      },
      { id: 'ledger', titleKey: 'product.area.ledger', views: [] },
      { id: 'closing', titleKey: 'product.area.closing', views: [] },
      { id: 'dunning', titleKey: 'product.area.dunning', views: [] },
    ],
  },
  {
    id: 'procurement',
    titleKey: 'product.module.procurement',
    icon: 'procurement',
    prefix: 'procurement',
    landing: null,
    areas: [
      { id: 'suppliers', titleKey: 'product.area.suppliers', views: [] },
      { id: 'purchasing', titleKey: 'product.area.purchasing', views: [] },
    ],
  },
  {
    id: 'inventory',
    titleKey: 'product.module.inventory',
    icon: 'inventory',
    prefix: 'inventory',
    landing: null,
    areas: [
      { id: 'stock', titleKey: 'product.area.stock', views: [] },
      { id: 'movements', titleKey: 'product.area.movements', views: [] },
    ],
  },
  {
    id: 'people',
    titleKey: 'product.module.people',
    icon: 'people',
    prefix: 'people',
    landing: null,
    areas: [
      { id: 'employees', titleKey: 'product.area.employees', views: [] },
      { id: 'payroll', titleKey: 'product.area.payroll', views: [] },
    ],
  },
];

export function isUnder(path: string, viewPath: string): boolean {
  return path === viewPath || path.startsWith(`${viewPath}/`);
}

export function areaOfPath(path: string): ModuleArea | null {
  const module = moduleOfPath(path);
  return (
    module.areas.find((area) =>
      area.views.some((view) => isUnder(path, view.path)),
    ) ?? null
  );
}

export function navSurfaceId(moduleId: string): string {
  return `navigation.${moduleId}`;
}

export function moduleOfPath(path: string): ProductModule {
  const overview = MODULES[0];
  const head = path.split('/')[0];
  return MODULES.find((module) => module.prefix !== '' && module.prefix === head) ?? overview;
}
