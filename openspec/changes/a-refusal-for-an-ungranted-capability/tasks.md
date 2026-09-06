## 1. The distinction

- [x] 1.1 Make the refusal reporter ask the broker whether the refused capability is base-granted
      for that plugin, and keep today's notice with the settings action for a revocation.
- [x] 1.2 Raise the neutral notice without an action for a capability never granted, in English and
      German.
- [x] 1.3 Pass the refusal's own message to the console in development when the capability was
      never granted.

## 2. Proving it

- [x] 2.1 Test that a refusal for a revoked capability keeps the settings action.
- [x] 2.2 Test that a refusal for a capability never granted raises the neutral notice with no
      action, and reaches the console in development.
- [x] 2.3 Test that both paths hold for a refusal handed over from the frame boundary.

## 3. Verification

- [x] 3.1 Run the shell tests and lint for what this touches.
- [x] 3.2 Run `openspec validate --all --strict`.
