## 1. The registration can carry a name

- [x] 1.1 A composition may give a frame plugin a name; omitting it stays valid and stays the
  behaviour it is today.
- [x] 1.2 The name reaches the surfaces that list plugins to the user, and nothing else reads it.

## 2. What is shown

- [x] 2.1 A named plugin is listed under its name.
- [x] 2.2 An unnamed one is listed under its identifier, with nothing derived from it.
- [x] 2.3 Grants, collisions and stored decisions still follow the identifier.

## 3. Verify

- [x] 3.1 Tests for each scenario of the added requirement, including the one that names the same
  plugin twice and expects one set of decisions.
- [x] 3.2 The published contract carries the field — checked in the packed types, not in the source
  barrel.

## 4. Use it

- [x] 4.1 After a release ships it, the demo names its payment plugin, so the permissions surface
  stops reading `payments`. Releasing is the owner's call, not a step to take unasked.
