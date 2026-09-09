## ADDED Requirements

### Requirement: A plugin may read whether its own work is unsaved

A plugin SHALL be able to read whether the work in a surface it registered is unsaved, reactively, so
that it can show that in its own views: the list a document was opened from is the natural place, and
it is a place the workbench cannot reach because it does not know what the list is about.

This read SHALL need no granted capability, on the same ground that a plugin needs none to run a
command it registered itself: it is asking about its own contribution. It SHALL answer nothing about
a surface another plugin registered, so that no plugin learns from it what another is working on.

The read is offered to a plugin the workbench renders itself. A plugin in a sandbox reports its own
unsaved work over its channel and is told about its own surface there; nothing of this shape crosses
that boundary.

#### Scenario: A plugin marks its own list

- **WHEN** a plugin reads whether one of its own surfaces holds unsaved work, and the work is then
  saved
- **THEN** the reading follows, and a view bound to it re-renders

#### Scenario: Another plugin's work stays private

- **WHEN** a plugin asks about a surface another plugin registered
- **THEN** it is told nothing about it

#### Scenario: No grant is consulted

- **WHEN** a plugin composed with no capabilities at all reads its own unsaved work
- **THEN** it is answered, because the surface is its own
