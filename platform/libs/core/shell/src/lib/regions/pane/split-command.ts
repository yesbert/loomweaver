import { Disposable } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { PaneService } from './pane.service';

const CONTENT_SPLIT_RIGHT_COMMAND_ID = 'shell.content.splitRight';

export function registerSplitCommand(
  registry: ContributionRegistry,
  panes: PaneService,
): Disposable {
  return registry.addCommand({
    id: CONTENT_SPLIT_RIGHT_COMMAND_ID,
    title: 'content.split.open',
    icon: 'splitPanes',
    shortcut: 'mod+\\',
    run: () => {
      if (panes.isSplit()) {
        panes.unsplit();
        return;
      }
      panes.splitRight();
    },
  });
}
