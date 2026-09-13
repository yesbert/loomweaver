## 1. Every element can be registered by its consumer

- [x] 1.1 Write a failing test: for every element the workbench registers on start, a registration
      function is reachable from the shell package's entry. It failed on the select, and also on the
      menu and the progress ring, which were unpublished in the same way.
- [x] 1.2 Write a failing test: content using the select, rendered without a running workbench after
      registering it from the package entry, finds the select and the option defined.
- [x] 1.3 Export the select's, the menu's and the progress ring's existing registration functions
      from the package entry, and give them the JSDoc their exported neighbours carry.
- [x] 1.4 Build and pack the shell, and confirm the registration functions are in the packed type
      declarations.

## 2. A settings row takes a line of its own

- [x] 2.1 Write a failing test that the row's host is a block. The unit environment applies no
      stylesheet, so it asserts the host's block class; the divider itself is measured in 2.3.
- [x] 2.2 Give the row's host a block display through the component's own host binding.
- [x] 2.3 Confirm in the running workbench that the settings surface draws a line between its rows,
      measuring the computed style of the row rather than judging the screenshot.

## 3. Saying it where consumers read

- [x] 3.1 Document every registration function beside the elements in the brief and in the design
      tokens guide, and stop exempting the registration functions from the documentation guard.
- [x] 3.2 Note in the pull request description, which the release notes are built from, that the row
      is now a block, for a consumer who drew their own separator around it.

## 4. Closing

- [x] 4.1 Run the unit suites and the repository guards.
- [x] 4.2 Run `openspec validate --all --strict`.
