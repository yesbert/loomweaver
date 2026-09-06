import { computed, signal } from '@angular/core';
import { type Cents, isoDaysFromToday, today } from '../accounting';

export type PayrollState = 'open' | 'paid';

export interface Employee {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly departmentKey: string;
  readonly joinedOn: string;
  readonly weeklyHours: number;
  readonly monthlyGross: Cents;
}

export interface PayrollRun {
  readonly id: string;
  readonly month: string;
  readonly state: PayrollState;
  readonly headcount: number;
  readonly gross: Cents;
}

interface EmployeeSeed {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly departmentKey: string;
  readonly joinedDaysAgo: number;
  readonly weeklyHours: number;
  readonly monthlyGross: Cents;
}

const EMPLOYEE_SEEDS: readonly EmployeeSeed[] = [
  { id: 'e-behrens', number: 'P-0101', name: 'Gambit the Cat', departmentKey: 'product.role.accounting', joinedDaysAgo: 2390, weeklyHours: 40, monthlyGross: 528_000 },
  { id: 'e-weiler', number: 'P-0102', name: 'Jonas Weiler', departmentKey: 'product.role.sales', joinedDaysAgo: 1135, weeklyHours: 40, monthlyGross: 471_000 },
  { id: 'e-kestner', number: 'P-0103', name: 'Ilka Kestner', departmentKey: 'product.people.department.workshop', joinedDaysAgo: 3385, weeklyHours: 40, monthlyGross: 402_500 },
  { id: 'e-adamek', number: 'P-0104', name: 'Piotr Adamek', departmentKey: 'product.people.department.warehouse', joinedDaysAgo: 700, weeklyHours: 35, monthlyGross: 318_000 },
  { id: 'e-rohde', number: 'P-0105', name: 'Marit Rohde', departmentKey: 'product.role.sales', joinedDaysAgo: 385, weeklyHours: 20, monthlyGross: 196_500 },
  { id: 'e-tavares', number: 'P-0106', name: 'Nuno Tavares', departmentKey: 'product.people.department.workshop', joinedDaysAgo: 1610, weeklyHours: 40, monthlyGross: 389_000 },
];

function seededEmployees(): readonly Employee[] {
  return EMPLOYEE_SEEDS.map((seed) => ({
    id: seed.id,
    number: seed.number,
    name: seed.name,
    departmentKey: seed.departmentKey,
    joinedOn: isoDaysFromToday(-seed.joinedDaysAgo),
    weeklyHours: seed.weeklyHours,
    monthlyGross: seed.monthlyGross,
  }));
}

function monthsBack(count: number): readonly string[] {
  const now = today();
  return Array.from({ length: count }, (_, back) => {
    const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}

function seededRuns(): readonly PayrollRun[] {
  const staff = seededEmployees();
  const gross = staff.reduce((sum, employee) => sum + employee.monthlyGross, 0);
  return monthsBack(3).map((month, back) => ({
    id: month,
    month,
    state: back === 0 ? 'open' : 'paid',
    headcount: staff.length,
    gross,
  }));
}

const employeeStore = signal<readonly Employee[]>(seededEmployees());
const runStore = signal<readonly PayrollRun[]>(seededRuns());

export const employees = employeeStore.asReadonly();
export const payrollRuns = runStore.asReadonly();

export function resetStaff(): void {
  employeeStore.set(seededEmployees());
  runStore.set(seededRuns());
}

export function employeeById(id: string): Employee | undefined {
  return employees().find((employee) => employee.id === id);
}

export const headcount = computed(() => employees().length);

export const monthlyGross = computed(() =>
  employees().reduce((sum, employee) => sum + employee.monthlyGross, 0),
);

export const openRun = computed<PayrollRun | null>(
  () => payrollRuns().find((run) => run.state === 'open') ?? null,
);

export function runPayroll(): PayrollRun | null {
  const due = openRun();
  if (!due) {
    return null;
  }
  const paid: PayrollRun = {
    ...due,
    state: 'paid',
    headcount: employees().length,
    gross: monthlyGross(),
  };
  runStore.update((all) => all.map((run) => (run.id === due.id ? paid : run)));
  return paid;
}
