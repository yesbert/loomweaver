## ADDED Requirements

### Requirement: A change of person can open the application afresh

A product MAY ask the workbench to reload when the person changes. Where it does, the workbench SHALL
reload when a person established in this page's lifetime is replaced by a different one, and at no
other moment: not at the first sign-in of an anonymous session, not at a sign-out, not when the same
person's roles change, and not for a session that names no person.

The reload SHALL open the application at its start, under the base it is served from, as opening it
without a path would. The address the previous person was at SHALL NOT be loaded again, so the next
person lands in their own arrangement or in the declared start, never on the previous person's
place. The question about unsaved work SHALL NOT be asked for this reload.

A pop-out window SHALL close instead, because what it shows belongs to the previous person. Where
the browser refuses to close it, it SHALL open the application at its start like any other window.

The limit: the workbench learns of the change only from the session the product supplies. A product
that names no person gets no reload.

#### Scenario: A different person after a sign-out does not inherit the address

- **WHEN** a person signs in, opens a record, signs out, and a different person signs in in the same
  page
- **THEN** the application reloads at its start
- **AND** the record the previous person had open is not shown

#### Scenario: The same person after a sign-out is back where they were

- **WHEN** a person signs out and the same person signs in again in the same page
- **THEN** nothing reloads and the address is unchanged

#### Scenario: A distribution served under a path reloads under it

- **WHEN** the application is served under a path and the person changes
- **THEN** the reload opens the application at that path, not at the root of the origin

#### Scenario: A pop-out window closes

- **WHEN** the person changes while a pop-out window is open
- **THEN** the pop-out window closes
