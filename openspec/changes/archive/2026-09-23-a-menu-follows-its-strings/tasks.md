## 1. Menus follow their strings

- [x] 1.1 Spec: an open declared menu, opened before its bundle, shows words once the bundle arrives, heading included (fails first)
- [x] 1.2 Spec: an open menu is re-worded on a language change and keeps the focused entry
- [x] 1.3 `MenuService`: build a menu with its `reword()`, subscribe in `present`, unsubscribe in `close`; `menu-heading.ts` gains the re-wording of its title, detail and accessible names
- [x] 1.4 `MenuListEntry.label` takes a key, a literal, or a function; move the view-instance switcher, the pane tab overflow and the pane target picker to it
- [x] 1.5 `ctx.ui.openMenu`: spec that an entry labelled by a key is translated and follows a language change, and a literal is shown as it is

## 2. The language switch loads first

- [x] 2.1 Spec: choosing a language not loaded yet keeps the previous one until its strings are there, then switches; a failed load still switches; the latest of two quick choices wins
- [x] 2.2 `LocaleService.applyLang`: load, then apply the signal, the active language and `<html lang>` together

## 3. Contract text and close

- [x] 3.1 JSDoc of `UiMenuItem` and `PluginUi.openMenu`: the label is a key or a literal
- [x] 3.2 `llms-full.txt` and the guides that call the ad-hoc label a literal
- [x] 3.3 Full shell suite, lint, `package` for `plugin-sdk` and `shell`, `openspec validate --all --strict`
