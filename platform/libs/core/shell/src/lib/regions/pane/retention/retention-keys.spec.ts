import { containerChildInstances } from './retention-keys';

describe('containerChildInstances (a container tab closes its children)', () => {
  const entries = [
    { key: 'container@workspace/1:c1|canvas', instance: 'child-a' },
    { key: 'container@workspace/1:c2|details|inst', instance: 'child-b' },
    { key: 'container@workspace/12:c1|canvas', instance: 'other-container' },
    { key: 'content:main|workspace/1', instance: 'outer' },
  ];

  it('collects every entry of the tab path own container dock', () => {
    expect(containerChildInstances(entries, 'workspace/1')).toEqual([
      'child-a',
      'child-b',
    ]);
  });

  it('never matches a longer sibling path or a non-container scope', () => {
    expect(containerChildInstances(entries, 'workspace/12')).toEqual([
      'other-container',
    ]);
    expect(containerChildInstances(entries, 'workspace')).toEqual([]);
  });
});
