import { auditWorkspaceDefinitions } from './definition-audit';

describe('auditWorkspaceDefinitions', () => {
  const regions = ['primary', 'secondary'];

  it('names duplicate ids, the reserved default id and unknown regions', () => {
    const problems = auditWorkspaceDefinitions(
      [
        { id: 'default', title: 'k' },
        { id: 'ws', title: 'k' },
        { id: 'ws', title: 'k' },
        { id: 'other', title: 'k', sidebars: { nope: [] } },
      ],
      regions,
    );
    expect(problems.some((p) => p.includes('"default"'))).toBe(true);
    expect(problems.some((p) => p.includes('declared twice'))).toBe(true);
    expect(problems.some((p) => p.includes('"nope"'))).toBe(true);
  });

  it('names structural content problems with their consequence', () => {
    const problems = auditWorkspaceDefinitions(
      [
        { id: 'ws', title: 'k', content: { tabs: [] } },
        {
          id: 'ws2',
          title: 'k',
          content: {
            columns: [
              { size: -1, tabs: ['a'] },
              {
                tabs: [
                  { path: 'b', active: true },
                  { path: 'c', active: true },
                ],
              },
            ],
          },
        },
      ],
      regions,
    );
    expect(problems.some((p) => p.includes('has no tabs'))).toBe(true);
    expect(problems.some((p) => p.includes('empty layout'))).toBe(true);
    expect(problems.some((p) => p.includes('positive percentage'))).toBe(true);
    expect(problems.some((p) => p.includes('the first wins'))).toBe(true);
  });

  it('names the second declaration that claims to be initial, since it is ignored', () => {
    const problems = auditWorkspaceDefinitions(
      [
        { id: 'first', title: 'F', initial: true },
        { id: 'second', title: 'S', initial: true },
      ],
      ['primary'],
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('"second"');
    expect(problems[0]).toContain('"first"');
  });
});
