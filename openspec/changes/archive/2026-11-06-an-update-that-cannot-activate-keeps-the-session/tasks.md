# Tasks

Every task is done when a test that failed before the change passes. Paths are under
`platform/libs/core/shell/src/lib/` unless they say otherwise.

## 0. Audit

- [x] 0.1 Inventory what already handles the concerns: the update service (`update/update.service.ts`), its notices (`update/update-notices.ts`), the unsaved-work question service (`regions/pane/unsaved-work/surface-close-guard.ts`) and every caller of it, the identity-scoped stores and their adoption (`persistence/identity-scope/`), the cross-window re-read (`persistence/cross-tab/state-sync.service.ts`), and the requirements in `product-identity` and `persistence-ports` that govern them

## 1. An update that cannot be activated keeps the session

- [x] 1.1 A rejected activation after consent does not reload, keeps the update on offer and shows `update.activationFailed`; applying again asks and activates afresh (`update/update.service.spec.ts`)
- [x] 1.2 The update asks through the unsaved-work question service, which tells when its question is answered; the update service no longer reads the dialog list (`regions/pane/unsaved-work/surface-close-guard.spec.ts`, `update/update.service.spec.ts`)
- [x] 1.3 The translation key in every shipped language

## 2. An adoption that does not answer is given up

- [x] 2.1 An adoption that has not settled after ten seconds settles in the person's namespace, stores the writes held during it, copies and deletes nothing anonymous, and shows `auth.localWorkKept`, with fake timers (`persistence/identity-scope/`)
- [x] 2.2 A port or handler answering after the bound writes nothing from the anonymous namespace
- [x] 2.3 The translation key in every shipped language, and the identity-scoped store options say what the adoption copies and where it stops

## 3. Guides

- [x] 3.1 `docs/updating.md` under 0.21.0, `docs/distribution/pwa.md`, `docs/distribution/persistence.md` and `llms-full.txt` say what the code now does
