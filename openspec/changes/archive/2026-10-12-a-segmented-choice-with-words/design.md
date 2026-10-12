## Context

The segmented class contract today holds icon buttons with a pressed state, sized for a toolbar. Two
NextPA cards carry the same hand-written radio markup for a choice with words.

## Goals / Non-Goals

**Goals:**

- One class contract a weaver can put on native radios to get the segmented look, with the semantics
  the browser already gives radios.

**Non-Goals:**

- An element. The contract says a control the browser provides is styled rather than wrapped, and a
  radio group is such a control.
- An animated marker that slides between options. It needs the options' measured positions, which a
  class contract cannot know without script; the chosen option is raised instead, as the icon segment's
  pressed state is, and with reduced motion that is what a person would see anyway.

## Decisions

**Extend the existing segmented group rather than introduce a second family.** The container stays the
segmented class; a new option class goes on a label that wraps a visually hidden native radio and its
words. One group class for both icon and word segments keeps one name for one look.

**Mark the chosen option by raising it, in the text colour.** The icon segment marks its pressed
state in the brand colour, but brand blue on the raised surface measures 3.3:1, below the bar for
text; an icon only needs 3:1. The chosen word is therefore raised and set in the content colour and a
heavier weight, which passes in both themes.

**Drive every state from the radio inside the label.** Chosen, focused and unavailable are read from
the radio's own state, so the markup needs nothing beyond the radio and its label.

**Name the group the usual way.** A fieldset with a legend, or a radiogroup role with a label; the
brief shows the first because it needs no ARIA.

Alternatives considered:

- *A new element with its own keyboard handling.* Re-implements what native radios do, and needs
  registering in isolated surfaces and under tests.
- *Reuse the icon segment with pressed buttons and words.* Toggle buttons do not announce a choice
  among options, and the keyboard behaviour would be one tab stop per button.

## Risks / Trade-offs

- [A weaver hides the radio with display none, which removes it from the tab order] → The class hides
  it itself, visually only, so the weaver writes no hiding rule.
