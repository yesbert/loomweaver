## Context

Chords are formatted by one function, which the workbench uses for command hints and for the
shortcuts a plugin gives the entries of a menu it opens, and which is published for distributions. It
knows the platform and a fixed table of labels for modifiers, Enter, Escape, Space and the arrows.
Every other key is printed as its capitalised token. The workbench's words live in its translation
bundles, read through a wording service that is reactive to language changes.

## Goals / Non-Goals

**Goals:**

- One spelling of a chord everywhere it is drawn, by the workbench or by a distribution calling the
  published function.

**Non-Goals:**

- Matching. Which physical key fires a binding is unchanged.
- Naming a printable character's key per keyboard layout (a German "Z" stays "Z").

## Decisions

**Symbols per platform in the formatting table, words through the workbench's translations.** macOS
symbols are the same in every language and stay in the table. Words for other platforms are looked up
under a shell translation key per key token, English and German shipped, with the table's English as
the fallback, so a product reword or a missing language degrades to today's output.

**The published function stays the single door.** Instead of a second, language-aware function, the
shell gives the formatting function its wording when it starts, as the function already reads the
platform from the browser. Because the wording read is reactive, a template or computed value that
formats a chord re-renders on a language change without asking for it. Without a running shell, as
under a unit test, the function falls back to the English words, as before.

Alternatives considered:

- *A language argument on the function.* Every caller would have to find and pass the language, and
  the shell's own hints would still need the reactive read.
- *A separate service for the shell's own hints, leaving the function in English.* Two spellings of
  one chord in one product, which is the inconsistency this fixes.

**A menu words its hints with its labels.** A menu drawn by the host already words its labels again
when the language changes. Its rows now carry the chord rather than the finished text, and the hint
is spelled at the same moment as the label. A menu drawn inside an isolated surface receives finished
hints from the host and draws them as given, because only the host knows the interface's words; the
host sends them again when they change.

**Name the key the binding is for.** Delete and Backspace keep distinct labels on macOS (⌦ and ⌫).
NextPA is told that a hint for its remove action should name the key its handler listens to.

## Risks / Trade-offs

- [A module-level wording is a hidden dependency] → It is set once by the shell and only ever narrows
  to a translation lookup; the fallback keeps the function pure where no shell runs, and a test covers
  both.
- [Translated modifier words change what users of a German interface see on Windows and Linux] → That
  is the intent; a product that prefers the English words rewords the keys.
