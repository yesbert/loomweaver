## 1. Say what a level reaches

- [x] 1.1 State in `plugin-sandbox` what each level obtains for itself, and that the workbench does
  not govern it: no origin means only what a service releases to any caller, an origin means
  whatever that origin is granted.
- [x] 1.2 State that separating a plugin's deployment does not separate the plugin — a document
  served at the application's address is the application as far as the browser is concerned.

## 2. Say where the permission model ends

- [x] 2.1 State in `plugin-permissions` that the capabilities govern the context and nothing else,
  and that data a plugin fetches for itself passes none of them.
- [x] 2.2 State that the workbench hands a plugin no credential, and that a permitted session tells
  a plugin who is signed in and with which roles, and nothing a service would accept as that person.

## 3. Hold it with a test

- [x] 3.1 Pin what an isolated surface is sent as its session: the sign-in state and the roles, and
  nothing further. Verify it fails against a session state carrying anything more.

## 4. Verify

- [x] 4.1 `openspec validate --all --strict` passes.
- [x] 4.2 The shell suite and lint pass.
