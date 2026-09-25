import { ShellLayout } from '@loomweaver/shell';

export const TESTBED_LAYOUT: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'primary', type: 'rail', dock: 'left' },
    { id: 'left-panel', type: 'panel', dock: 'left' },
    { id: 'left-footer', type: 'bar', dock: 'left' },
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'right-panel', type: 'panel', dock: 'right' },
    { id: 'secondary', type: 'rail', dock: 'right' },
    { id: 'right-footer', type: 'bar', dock: 'right' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
  ],
};
