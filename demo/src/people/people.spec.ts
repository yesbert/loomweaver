import { setReferenceDate } from '../accounting/clock';
import {
  employeeById,
  employees,
  headcount,
  monthlyGross,
  openRun,
  payrollRuns,
  resetStaff,
  runPayroll,
} from './staff';

describe('staff', () => {
  beforeEach(() => {
    setReferenceDate(new Date('2026-06-15T12:00:00Z'));
    resetStaff();
  });

  afterEach(() => setReferenceDate(null));

  it('adds the monthly gross of everyone on the payroll', () => {
    expect(monthlyGross()).toBe(
      employees().reduce((sum, employee) => sum + employee.monthlyGross, 0),
    );
    expect(headcount()).toBe(employees().length);
  });

  it('leaves the current month open and the ones before it paid', () => {
    const [current, previous, older] = payrollRuns();

    expect(current.month).toBe('2026-06');
    expect(current.state).toBe('open');
    expect(previous.state).toBe('paid');
    expect(older.state).toBe('paid');
  });

  it('pays the open month once, and has nothing to do the second time', () => {
    const paid = runPayroll();

    expect(paid?.month).toBe('2026-06');
    expect(openRun()).toBeNull();
    expect(runPayroll()).toBeNull();
    expect(payrollRuns().every((run) => run.state === 'paid')).toBe(true);
  });

  it('books what the payroll actually costs at the moment it is run', () => {
    const paid = runPayroll();

    expect(paid?.gross).toBe(monthlyGross());
    expect(paid?.headcount).toBe(headcount());
  });

  it('keeps a part-time contract below a full week', () => {
    const partTime = employees().filter((employee) => employee.weeklyHours < 40);

    expect(partTime.map((employee) => employee.number)).toEqual(['P-0104', 'P-0105']);
    expect(employeeById('e-rohde')?.weeklyHours).toBe(20);
  });

  it('names a department for everyone, as a key rather than as prose', () => {
    for (const employee of employees()) {
      expect(employee.departmentKey.startsWith('product.')).toBe(true);
    }
  });
});
