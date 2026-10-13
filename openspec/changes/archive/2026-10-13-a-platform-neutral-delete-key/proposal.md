> **Status:** approved.

## Why

NextPA reported on 2026-10-13 (finding F-054) that a shortcut for "remove this" cannot be written once
for every platform. The key that removes something on a Mac is the one labelled ⌫, which sends
Backspace; a MacBook has no forward delete key at all. On Windows and Linux it is Delete (`Entf` in
German). A shortcut declared as `delete` is drawn as ⌦ on a Mac, faithfully, and names a key the
person may not have. A product that wants the conventional key on both platforms has to detect the
platform itself, and the workbench does not publish that check.

The workbench behaves as specified: the hint names the key the binding is for. What is missing is a
way to say "the platform's delete key", the way the neutral modifier already says "the platform's
command modifier".

## What Changes

- The shortcut vocabulary gains a neutral delete key, written `del`. It stands for Backspace (⌫) on
  macOS and for Delete everywhere else, for a command's binding and for every hint alike: `mod+del` is
  ⌘⌫ on a Mac and `Strg+Entf` in German on Windows and Linux.
- The hint for `del` is drawn exactly as the key it stands for on that platform, so it follows the
  existing spelling and translation rules and needs no new words.
- `delete` and `backspace` keep meaning the physical keys they name today.
- A clash between `del` and the key it stands for on the running platform is reported like any other
  clash between two commands with the same shortcut.
- `commands` states it in the shortcut requirement.

Additive: `del` is not a key the workbench understands today, so no existing declaration changes
meaning. Ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands`: a shortcut may name the platform's delete key in a neutral form, which binds and is
  displayed as Backspace on macOS and as Delete elsewhere.

## Impact

- The shell's chord parsing and formatting, used for binding, for clash detection and for every hint
  (command hints, plugin menu entries, the published chord formatting function).
- The JSDoc of a command's shortcut, of a menu entry's shortcut and of the published chord formatting
  function; `llms-full.txt`; the commands and menus guides of the weaver documentation.
- Unit tests of binding and formatting per platform.
- NextPA finding F-054.
