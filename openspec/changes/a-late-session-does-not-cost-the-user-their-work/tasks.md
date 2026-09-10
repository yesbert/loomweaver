## 1. Pin the loss

- [x] 1.1 Add a failing test: an arrangement is stored for a person, the application is opened while
      the identity is still unknown, the identity becomes known, and an ordinary action follows.
      Today the person's stored arrangement is replaced by the declared one.
- [x] 1.2 Add the companion test for a person the product has never seen: what the workbench holds
      must survive the adoption and be written.

## 2. Make the adoption visible

- [x] 2.1 Let the shared identity latch be watched, so the moment it closes on an identity is a fact
      the workbench can read.
- [x] 2.2 Hold writes through both ports from that moment until the re-read has landed, and drop
      what those writes carried.

## 3. Read the adopted namespace before writing to it

- [x] 3.1 On adoption, read every registered key again through its port and apply it.
- [x] 3.2 Register the state that is restored at boot without a channel today, so the re-read reaches
      it. Those were: the workspace's pane trees and hidden views and which workspace is active
      (through the workspace machinery), the panels' collapsed state, the panels' widths, the user's
      order of rail and panel items, and the per-plugin state family.
- [x] 3.3 Make 1.1 and 1.2 pass, and confirm a product that answers the identity at the first read
      reads once and behaves exactly as before.

## 4. Pin the bounce

- [x] 4.1 Add a failing test: opened at an address whose content is not reachable yet, the user
      navigates elsewhere, the content becomes reachable afterwards. Today the user is pulled back.
- [x] 4.2 Add the companion test: the same, with no navigation by the user, still reaches the
      content the opening address names.

## 5. One fact for "the user has moved"

- [x] 5.1 Mark the user as having moved on any navigation the workbench did not itself start, not
      only on a browser history event.
- [x] 5.2 Read that fact in every re-navigation the workbench performs on its own, the opening
      address and an address it chose earlier alike.
- [x] 5.3 Make 4.1 and 4.2 pass.

## 6. Close it out

- [x] 6.1 Check what the seam's documentation asks of a product about answering the identity at
      boot, and say plainly what the workbench now does when it cannot.
- [x] 6.2 Run the shell's tests, the demo's tests and the repository's guards.
- [ ] 6.3 Report to NextPA what the upgrade fixes for them and what stays theirs: the flash before
      the session lands, which only a persisted last-known subject removes.
