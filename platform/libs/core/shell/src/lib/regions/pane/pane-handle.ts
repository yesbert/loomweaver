declare const PANE_HANDLE: unique symbol;

/**
 * Names one pane of the content area for as long as that pane exists. Handed out by `PaneService`
 * and accepted back by it; opaque, so a distribution keeps it without learning how the workbench
 * identifies panes. A handle of a pane that has since been closed names nothing: every action given
 * it does nothing.
 */
export type PaneHandle = string & { readonly [PANE_HANDLE]: true };

export function paneHandle(paneId: string): PaneHandle {
  return paneId as PaneHandle;
}
