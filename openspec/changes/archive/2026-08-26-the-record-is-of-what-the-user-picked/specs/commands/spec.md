## MODIFIED Requirements

### Requirement: Running a command is one place, and failures surface there

Every trigger SHALL run its command through one place, so that access rules, the rule about a window
showing a single piece of work and failure reporting cannot differ by route. A command that fails
SHALL be reported rather than leaving an unhandled failure, and a command refused for lack of
permission SHALL surface to the user rather than only to the console.

What the seam makes uniform is what it decides. It does not decide what the search remembers, and
that record is therefore not uniform across routes; the requirement covering the search says who
writes it.

#### Scenario: A failing command is reported

- **WHEN** a command throws, or its asynchronous work rejects
- **THEN** the failure is reported and nothing is left unhandled

#### Scenario: A refusal reaches the user

- **WHEN** a command is refused because the plugin behind it lacks a permission
- **THEN** the user is told, rather than the refusal appearing only in the console

#### Scenario: One route's rules are every route's rules

- **WHEN** a command is refused for one trigger because of the session or the window
- **THEN** it is refused for every other trigger under the same conditions

### Requirement: The search remembers what was used, unless the product says otherwise

Commands the user picked **in the search** SHALL be offered first there under their own heading, and
no other trigger SHALL add to that record. It is a memory of what the user reached for in that one
place, not a count of how often a command ran: a command driven by its shortcut is one the user can
already reach without searching, and putting it at the top of the search would crowd out the entries
the search exists to surface.

A distribution MAY switch the record off, in which case no history SHALL be kept at all. With no
history yet, no headings SHALL be shown.

#### Scenario: A used command leads the next search

- **WHEN** the user picks a command in the search and opens the search again
- **THEN** it is offered first, under a heading naming it as recently used

#### Scenario: Another trigger leaves the record alone

- **WHEN** the user runs a command by its shortcut, or from an item in the chrome, and opens the
  search
- **THEN** that command has not joined the recently-used heading

#### Scenario: An invocation nobody chose leaves the record alone

- **WHEN** a command is invoked by its identity rather than by a person
- **THEN** it has not joined the recently-used heading

#### Scenario: Switching the history off keeps none

- **WHEN** a distribution switches the recently-used list off
- **THEN** nothing is recorded
