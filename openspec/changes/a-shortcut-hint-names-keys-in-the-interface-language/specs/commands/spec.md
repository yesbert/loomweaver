## MODIFIED Requirements

### Requirement: A command may carry a shortcut, expressed once for every platform

A command MAY declare a keyboard shortcut in a platform-neutral form, and the workbench SHALL bind
and display it in the spelling of the platform it is running on. Bindings SHALL follow the registered
commands, so a shortcut appears and disappears with the plugin that owns it.

Displaying a shortcut SHALL name every key in it the way the platform names it: as the platform's
symbol where it has one, and otherwise as a word in the language the interface is shown in. A word
SHALL come from the workbench's own translations, so a product can reword it, and SHALL follow a change
of language. Every hint the workbench draws SHALL be spelled this way, whether it shows a command's
shortcut or the keys a plugin gives an entry of a menu it opens. The hint SHALL name the key the
binding is for, not a neighbouring key the platform happens to label alike.

The limit: a key the workbench has no name for is shown as it is written in the declaration. A
language that carries no word for a key shows the English one.

Matching SHALL use the physical key, so that a shortcut combining a modifier with a digit or a
letter still matches where the modifier changes the character produced.

#### Scenario: One declaration works on every platform

- **WHEN** a command declares a shortcut using the neutral modifier
- **THEN** it binds to the platform's own modifier and is displayed in that platform's spelling

#### Scenario: A modifier that changes the character still matches

- **WHEN** a shortcut combines a modifier with a digit or a letter and the modifier changes the
  character the keyboard produces
- **THEN** the shortcut still matches

#### Scenario: Shortcuts follow the commands

- **WHEN** a plugin is deactivated
- **THEN** its shortcuts stop working

#### Scenario: A clash is reported and resolved predictably

- **WHEN** two commands declare the same shortcut
- **THEN** the developer is told, and the later registration wins

#### Scenario: A named key is shown in the interface language

- **WHEN** the interface is shown in German on a platform that names keys with words, and a hint shows
  a shortcut with the control modifier and the delete key
- **THEN** it reads as a German keyboard labels them, "Strg+Entf", not "Ctrl+Delete"

#### Scenario: A named key is shown as the platform's symbol

- **WHEN** a hint on macOS shows a shortcut on the forward delete key, the backspace key or the tab key
- **THEN** it shows ⌦, ⌫ or ⇥, whatever the language

#### Scenario: A plugin's menu entry is spelled like a command's hint

- **WHEN** a plugin opens a menu whose entry carries a shortcut
- **THEN** that hint is spelled as the same shortcut on a command would be

#### Scenario: A change of language reaches the hint

- **WHEN** the language changes while hints are shown
- **THEN** the hints are spelled in the new language
