export function sideForMoveChord(
  event: KeyboardEvent,
): 'left' | 'right' | null {
  if (!event.altKey || !event.shiftKey) {
    return null;
  }
  if (event.key === 'ArrowRight') {
    return 'right';
  }
  return event.key === 'ArrowLeft' ? 'left' : null;
}
