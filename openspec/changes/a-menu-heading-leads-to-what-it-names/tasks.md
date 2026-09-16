## 1. A heading that leads somewhere

- [x] 1.1 In the plugin SDK, add `command?: string` to `MenuHeader`, with JSDoc saying the heading then
      becomes the menu's first entry, is announced by the command's title, and stays a plain heading
      when the command is not registered.
- [x] 1.2 In the menu service, draw a heading whose command is registered and titled as a menu item
      (role, tabindex, reserved selection key, accessible name from the command's title), map that
      key to running the command with the menu's context, and open a menu whose only entry is such a
      heading.
- [x] 1.3 In the shell stylesheet, give a leading heading the entry's hover and focus look and a
      pointer cursor, and bring the comment above `.lw-menu-header` in line.
- [x] 1.4 Unit tests on the menu service and element, one per scenario of the modified requirement:
      click runs and closes, the down arrow reaches the heading first and Enter and Space run it, the
      accessible names of menu and heading, an unregistered command leaves a plain heading passed
      over by the keyboard, a menu with only a leading heading opens, a heading without a command is
      unchanged.

## 2. Seeing it

- [x] 2.1 Let the demo's account menu heading lead to an account command where the demo has one, or
      the testbed's account item otherwise, so it can be tried in the running application.

## 3. Documentation

- [x] 3.1 `docs/weaver/menus.md`: the heading paragraph states the optional command, how it is
      reached and announced, and the fallback; the account example shows it.
- [x] 3.2 `llms-full.txt` `menuHeader` notes and `MenuHeader` shape. `docs/samples.md` stays as it
      is: its account recipe reproduces what the auth scaffold writes, which registers no profile
      command to lead to.

## 4. Saying it is done

- [x] 4.1 `openspec validate --all --strict`, lint, the shell and plugin-sdk unit suites, the
      comments, api-docs and bundle-size checks green.
