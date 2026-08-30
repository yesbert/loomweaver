> **Status:** approved.

## Why

A menu opened at the pointer needs no title: the thing it acts on is under the pointer. A menu opened
from a control does not have that. The control is a two-letter badge or a single icon, so the menu is
the first place the name of the account, the document or the tenant could appear at all, and today it
cannot appear there: a menu is a list of entries and nothing else.

## What Changes

- An item that opens its menu from the chrome MAY name what that menu was opened against: a name, an
  optional second line, and optionally an icon or a short mark of its own.
- The heading is not an entry. It cannot be focused or activated, the keyboard passes over it the way
  it passes over a separator, and it does not become another way to run something.
- The menu is announced by that name, once: what the heading shows is not read a second time as
  content.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: a menu opened from a contributed item may carry a heading naming what it was opened
  against, which is not an entry and does not join the entry sequence.

## Impact

- **Published contract:** `RailItem` and `BarButtonItem` gain an optional heading declaration.
  Additive; a menu without one looks exactly as it does today.
- **Shell:** the menu service draws the heading and labels the menu from it; the menu's stylesheet
  gains the heading's appearance.
- **Documentation:** `llms-full.txt`, the weaver guide and the JSDoc on both item types.
- **Legacy sources dissolved:** none.
