## 1. The entry knows its authority

- [x] 1.1 A catalogue entry says whether it is offered or deployed; an entry that says nothing is
  offered, so nothing already published changes meaning.
- [x] 1.2 A deployed entry becomes active holding exactly the permissions it names, with no consent
  sought, and a permission the platform does not define is dropped as it already is.
- [x] 1.3 A composed plugin still wins an identity collision, now against deployed entries too.

## 2. Read at startup, and survive a lost catalogue

- [x] 2.1 A catalogue that deploys is read as the application starts, not only when a surface that
  shows it opens.
- [x] 2.2 The set last seen is remembered through the persistence seam, separately from what the user
  installed — the two have different owners and must not share a store.
- [x] 2.3 A catalogue that answers replaces the remembered set entirely; an entry it no longer
  carries stops being active.
- [x] 2.4 A catalogue that cannot be reached leaves the last deployed set active and reports the
  failure rather than swallowing it.
- [x] 2.5 Decide and document how long startup waits for the read before proceeding without it.

## 3. Whose plugin is it

- [x] 3.1 A deployed plugin is listed among what is active and marked as provided rather than chosen.
- [x] 3.2 It is offered no route to be removed, and none to be turned off.
- [x] 3.3 Its own settings stay reachable exactly as any other plugin's.
- [x] 3.4 The permissions surface states what it holds and offers no switch to withdraw it.

## 4. What the user chose stays theirs

- [x] 4.1 Consent, management, removal and revocation are unchanged for a plugin the user installed —
  pinned by tests, because this change must not quietly narrow a right it only meant to give a
  subject.

## 5. Say what it is

- [x] 5.1 `docs/plugins.md` describes arrival paths with their authorities named, and states that a
  catalogue which deploys is a place where rights are issued — so it belongs behind the port and an
  authenticated write, not in a static document.

## 6. Verify

- [x] 6.1 Build, unit tests, end-to-end suite and the licence gate pass.
- [x] 6.2 `openspec validate --all --strict` passes.
