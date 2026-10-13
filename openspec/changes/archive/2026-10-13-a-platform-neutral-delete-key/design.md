## Context

One parser turns a chord into a signature for binding and for the clash report, and one formatter
turns it into the hint every surface draws, including the published chord formatting function. Both
already take the platform as an argument, because the neutral modifier resolves differently on macOS.
Token aliases (`cmd`, `esc`, `return`, …) are resolved without the platform, before either step.

## Goals / Non-Goals

**Goals:**

- `del` resolves once, in the same place as `mod`, so binding, clash detection and hint cannot
  disagree about which key it is.

**Non-Goals:**

- Binding `del` to both keys of a platform. See Decisions.
- Publishing a platform check.

## Decisions

**A neutral token rather than an exported platform check.** The finding offered both. A token works
for a command's binding as well as for a hint, so a product declares the shortcut once and never asks
which platform it runs on. An exported check would only help the product draw a hint, would leave
every product to branch on it, and would add a second door to a vocabulary that already has one.

**The name `del`.** It reads as "the key labelled delete", which is what the key is called on both
platforms: the ⌫ key on a Mac keyboard is labelled "delete", and the forward delete key on a PC
keyboard is labelled "Del" or "Entf". The workbench does not recognise `del` today, so a declaration
using it binds to nothing at present; no existing shortcut changes meaning.

Alternatives considered:

- *Making `del` an alias of `delete`.* The obvious reading of the abbreviation on a PC, but it would
  leave the Mac case unsolved, which is the point of the finding.
- *A longer, unmistakable name such as `deletekey` or `remove`.* Clearer in isolation, but it reads
  like a command rather than a key, and nothing else in the vocabulary is named that way.

**Resolved with the platform, not as an alias.** Aliases are platform-blind, so `del` is resolved
beside `mod`: to `backspace` on macOS and to `delete` elsewhere, both when a signature is built and
when a hint is spelled. The hint then falls through to the existing label of the resolved key, which
gives ⌫ on macOS and the translated word for Delete elsewhere, with no new translation strings.

**One key per platform.** On macOS forward delete is fn+⌫ on a laptop; binding `del` to it as well
would make one declaration claim two keys and two signatures, and complicate the clash report. A
product that wants both, as NextPA's card handling does, declares both or handles them itself.

## Risks / Trade-offs

- [Someone writes `del` expecting forward delete on a Mac] → The JSDoc and the guides say what `del`
  stands for beside `delete` and `backspace`; the hint shows ⌫, so the difference is visible at once.
- [A product declares `del` and `backspace` for two commands] → On macOS they clash and the clash is
  reported, which is the existing behaviour for two commands with one key.
