/** Handle to undo a contribution (a plugin keeps it to clean up on deactivate). */
export interface Disposable {
  /** Undoes the contribution. */
  dispose(): void;
}
