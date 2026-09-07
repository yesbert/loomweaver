## 1. The plugin

- [x] 1.1 Add the demo plugin `about` (in-page, `contributions`, `ui`) with the command
      `demo.about` that opens the welcome dialog, and register it in the demo's app config and grants.
- [x] 1.2 Build the About body component: logo, the three paragraphs, the platform version, the
      documentation link opening in a new tab. Build the dialog around it with the welcoming heading
      and "Got it".
- [x] 1.3 Register the settings section "About" from the plugin, holding the body as a component row.
- [x] 1.4 Open the dialog once per browser on activation, remembered in the plugin's private store.
- [x] 1.5 Translations in English and German, in the demo's product bundle.

## 2. The status bar

- [x] 2.1 Omit `shell.version` from the shell's defaults in the demo and add the About entry in its
      place: a component showing the info icon and the version, running `demo.about` on click.

## 3. Proving it

- [x] 3.1 Seed "welcomed" once in the demo's Playwright configuration so no existing test meets the
      dialog, and check that the existing suite is unchanged.
- [x] 3.2 Add a demo test: a first visit shows the welcome, "Got it" closes it, a reload does not
      show it again, the status bar entry opens it, and the settings hold the About section.
- [x] 3.3 Unit-test the plugin's contributions as the other demo plugins do.

## 4. Verification

- [x] 4.1 Run the demo unit tests and the demo end-to-end suite.
- [x] 4.2 Run `openspec validate --all --strict`.
