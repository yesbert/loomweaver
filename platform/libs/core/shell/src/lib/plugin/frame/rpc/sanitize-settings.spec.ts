import { FrameSettingsSection } from '@loomweaver/plugin-sdk';
import { sanitizeRpcSettingsSection } from './sanitize-settings';

function asSection(raw: unknown): FrameSettingsSection {
  return raw as FrameSettingsSection;
}

function validSection(
  overrides: Record<string, unknown> = {},
): FrameSettingsSection {
  return asSection({
    id: 'prefs',
    title: 'My plugin',
    rows: [
      {
        id: 'greeting',
        label: 'Greeting',
        control: { kind: 'text', value: 'Hello' },
      },
      { id: 'loud', label: 'Shout', control: { kind: 'toggle', value: false } },
    ],
    ...overrides,
  });
}

describe('sanitizeRpcSettingsSection', () => {
  it('rebuilds a section as a literal of exactly the declared fields', () => {
    const section = sanitizeRpcSettingsSection(
      'p1',
      validSection({ order: 3, smuggled: () => 'nope' }),
    );

    expect(section).toEqual({
      id: 'prefs',
      title: 'My plugin',
      order: 3,
      rows: [
        {
          id: 'greeting',
          label: 'Greeting',
          description: undefined,
          control: {
            kind: 'text',
            value: 'Hello',
            inputType: undefined,
            placeholder: undefined,
          },
        },
        {
          id: 'loud',
          label: 'Shout',
          description: undefined,
          control: { kind: 'toggle', value: false },
        },
      ],
    });
    expect('smuggled' in section).toBe(false);
  });

  it('rejects a missing id, title or empty rows', () => {
    expect(() =>
      sanitizeRpcSettingsSection('p1', validSection({ id: '' })),
    ).toThrow(/'id'/);
    expect(() =>
      sanitizeRpcSettingsSection('p1', validSection({ title: '' })),
    ).toThrow(/'title'/);
    expect(() =>
      sanitizeRpcSettingsSection('p1', validSection({ rows: [] })),
    ).toThrow(/row/);
  });

  it('rejects a control whose kind and default value do not match', () => {
    expect(() =>
      sanitizeRpcSettingsSection(
        'p1',
        validSection({
          rows: [
            { id: 'x', label: 'X', control: { kind: 'toggle', value: 'yes' } },
          ],
        }),
      ),
    ).toThrow(/toggle\/text\/select\/slider/);
    expect(() =>
      sanitizeRpcSettingsSection(
        'p1',
        validSection({
          rows: [{ id: 'x', label: 'X', control: { kind: 'component' } }],
        }),
      ),
    ).toThrow(/toggle\/text\/select\/slider/);
  });

  it('rejects a select without options and keeps only well-formed options', () => {
    expect(() =>
      sanitizeRpcSettingsSection(
        'p1',
        validSection({
          rows: [
            { id: 'x', label: 'X', control: { kind: 'select', value: 'a' } },
          ],
        }),
      ),
    ).toThrow(/option/);

    const section = sanitizeRpcSettingsSection(
      'p1',
      validSection({
        rows: [
          {
            id: 'x',
            label: 'X',
            control: {
              kind: 'select',
              value: 'a',
              options: [{ value: 'a', label: 'A' }, { value: 1 }, 'junk'],
            },
          },
        ],
      }),
    );
    expect(section.rows[0].control).toEqual({
      kind: 'select',
      value: 'a',
      options: [{ value: 'a', label: 'A' }],
    });
  });
});
