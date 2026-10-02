## 1. Pin it

- [x] 1.1 A spec composing the identity-scoped working-state store with the plugin store: two identities write the same plugin key in turn, each reads back its own, and the anonymous namespace sees neither
- [x] 1.2 If it fails, stop and revise this change with the fix it needs

## 2. Tell

- [x] 2.1 `docs/weaver/plugin-state.md`: whose the store is, what a product without an identity means, and that a plugin does not clear on sign-out
- [x] 2.2 JSDoc on the plugin store and on the session: the store is per person; the session names no subject, and why
- [x] 2.3 `llms-full.txt`: the plugin store's keys in the inventory with their scope (`docs/distribution/persistence.md` already lists them as identity state)

## 3. Verify

- [x] 3.1 The shell suite, lint, formatting, `nx package`, the packed-types and docs checks

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
