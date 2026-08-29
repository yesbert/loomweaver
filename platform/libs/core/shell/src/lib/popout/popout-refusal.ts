export function popoutNavigationRefusal(path: string): string {
  return (
    `Content navigation to "${path}" was ignored: this is a pop-out window, which shows one ` +
    `surface and has no content area to navigate. A command reaches a pop-out's palette only ` +
    `if it declares popout: true, so leave that off anything that navigates.`
  );
}
