## 1. One declared set

- [x] 1.1 Write failing tests for the declaration: nothing declared serves English and German; a
      declared set adds a language, leaves one out, and may contain neither shipped language; codes
      are canonicalised and duplicates collapse; an empty set or a malformed code is refused at
      composition with the problem named.
- [x] 1.2 Add the language declaration to the shell's options and derive a single served set from
      it, available before the first paint.
- [x] 1.3 Feed the translation library's available languages from that set, and remove the fixed
      constant and the two-code type.

## 2. The starting language

- [x] 2.1 Write failing tests for detection against a declared set: a stored served value wins; a
      stored value no longer served is ignored; an exact browser preference matches; a regional
      preference matches its region-less served language and not the reverse; English is the last
      resort where served; otherwise the first declared language.
- [x] 2.2 Make detection, the stored-value check and the synchronised-value check read the served
      set.

## 3. Workbench strings for a language the workbench does not ship

- [x] 3.1 Write failing tests for the loader: a shipped language loads as today; a product language
      with a partial file shows supplied strings, falls back to English for the rest and reports the
      missing keys once in development; a product language with no file is English throughout,
      reported once, and does not fail the language load; named bundles and the overlay still apply
      on top.
- [x] 3.2 Implement the English base and key-by-key merge for languages the workbench does not ship,
      reusing the overlay's merge.
- [x] 3.3 Confirm the missing-key handler does not report keys that are shown from the English base.

## 4. The language service, published

- [x] 4.1 Write failing tests: the active language is readable as a signal; the served languages are
      readable with the name of each in its own language, falling back to the code; setting a served
      language applies it everywhere at once, stores it and synchronises it; setting an unserved
      language leaves the active one and warns in development.
- [x] 4.2 Widen the service to string codes, add the named served languages, and export it from the
      shell package with JSDoc on its published members.
- [x] 4.3 Confirm the document declares a product language, and that an isolated surface and a
      pop-out window receive it.
- [x] 4.4 Let the shipped switcher take its languages and names from the service, keeping its look:
      English and German with their flags exactly as today, a language without a flag under its own
      name, and shown by its code when compact. Confirm with its existing tests unchanged and one
      added for a declared third language. The theme control is not touched.
- [x] 4.5 Build and pack the shell, and confirm the service and the options field are in the packed
      type declarations.

## 5. Replacing a settings row

- [x] 5.1 Write failing tests: a replaced row takes its place and leaves the section's other rows and
      order; a replacement applies to a section contributed again later; a removal of the same
      identity wins; disposing the replacement restores the contributed row.
- [x] 5.2 Add row replacement to the settings service as a lasting instruction, applied after removal
      when visible sections are computed.
- [x] 5.3 Write a failing test that the composition report names a replacement matching no
      contributed row and says nothing about one that matched, then implement it beside the check for
      removals.

## 6. Saying it where consumers read

- [x] 6.1 In the guide on icons and translations, describe declaring the served set, supplying the
      workbench's strings for a further language in the shipped location, and what is reported when
      some are missing.
- [x] 6.2 In the guide on recomposing the chrome, describe replacing or moving the workbench's
      language, theme, update and version bar items by their identity, naming the published service
      each one drives, and replacing a single settings row.
- [x] 6.3 Bring the brief up to date: the language service, the declaration, row replacement, and the
      bar-control paragraph.
- [x] 6.4 Note in the changelog how a distribution that replaced translation loading for a further
      language moves to the declaration.

## 7. Closing

- [x] 7.1 Run the unit suites and the repository guards.
- [x] 7.2 In the demo, declare a set with a third language and without German, and confirm in the
      running app that the switcher, the document language, a reload and a second window all follow
      it.
- [x] 7.3 Run `openspec validate --all --strict`.
