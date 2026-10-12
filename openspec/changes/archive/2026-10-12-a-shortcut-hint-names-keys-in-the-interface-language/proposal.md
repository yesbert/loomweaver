> **Status:** approved.

## Why

NextPA reported on 2026-10-12 (finding F-052) that a shortcut hint shows a named key as an English
word whatever the language: its German card menu read "Karte entfernen … Delete". Arrow keys come out
as arrows, but every key the workbench has no label for is printed as its capitalised English name.

It is wider than the one key. On macOS the workbench draws modifiers as the platform's symbols, but
named keys such as Delete, Backspace, Tab, Home, End and the page keys are printed as words where the
platform has symbols. Elsewhere, the modifiers are printed in English too, so a German interface on
Windows says "Ctrl" where the keyboard says "Strg". The finding assumed modifiers were already
translated; they are not.

One correction to the finding's proposal: on macOS the key labelled ⌫ sends Backspace, and Delete is
forward delete, ⌦. A hint drawn as ⌫ for a binding to Delete would promise a key that does not fire
it. The hint names the key the binding is for, in the platform's way.

## What Changes

- Every shortcut hint the workbench draws, for a command and for an entry of a menu a plugin opens,
  names its keys in the platform's way and, where the platform uses words, in the interface language:
  for example Strg, Umschalt, Entf, Pos1 and Bild↑ in German on Windows and Linux.
- macOS shows its symbols for the editing and paging keys: ⌦, ⌫, ⇥, ↖, ↘, ⇞ and ⇟, beside the
  modifier symbols and ↵ it already showed.
- The words are the workbench's own translations, so a product can reword them like any other
  workbench string, and a hint follows a change of language.
- The published chord formatting function gives the same result as the workbench's own hints; without
  a running workbench it falls back to the English words.
- `commands` states it in the shortcut requirement.

No API change; ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands`: a shortcut is displayed in the platform's spelling and, where that spelling is words, in
  the interface language.

## Impact

- The shell's chord formatting, the places that draw a hint (command hints, plugin menu entries), the
  menu drawing, which now words a hint with its label, and the shell's English and German
  translations.
- The JSDoc of the published chord formatting function and of a menu entry's shortcut; `llms-full.txt`;
  the commands guide of the distribution API.
- Unit tests of the formatting per platform and language.
- NextPA finding F-052.
