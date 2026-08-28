# popout-windows Specification

## Purpose
A user with a second screen wants one thing on it. A pop-out is that: one piece of work in a browser
window of its own, sharing the session and the state of the application it came from, without
becoming a second copy of the application.

## Requirements

### Requirement: A pop-out shows one piece of work and nothing else

A pop-out window SHALL show exactly one piece of work, without the launcher, the sidebars or the tab
strips. Everything that is not the workbench's arrangement — appearance, text size, dialogs, notices
and the session — SHALL work as in the main window, because it is the same application.

#### Scenario: The window is bare

- **WHEN** a piece of work is opened in a window of its own
- **THEN** it fills the window, with no launcher, sidebar or tab strip

#### Scenario: The window carries the product's name

- **WHEN** a pop-out window opens
- **THEN** it is titled with the product's identity

### Requirement: Tearing off duplicates rather than moves

Opening something in a window of its own SHALL leave it where it was. Both SHALL be usable, and
where they share stored state they SHALL mirror each other live.

#### Scenario: The original stays put

- **WHEN** the user opens a view in a window of its own
- **THEN** it is still present in the main window

#### Scenario: The two mirror each other

- **WHEN** the same work is shown in the main window and in its pop-out
- **THEN** a change to its stored state appears in both

### Requirement: A pop-out never writes the arrangement

A pop-out SHALL NOT write any of the state describing how the application is arranged. Its existence
SHALL leave the main window's panes, panel widths and open tabs exactly as they were.

#### Scenario: Opening and using a pop-out leaves the arrangement untouched

- **WHEN** work is opened in a window of its own and used there
- **THEN** the stored arrangement is unchanged

### Requirement: A pop-out cannot stop being one

A pop-out SHALL refuse navigation that would turn it into an ordinary application window, and SHALL
report the refusal to the developer. Work that moves within itself SHALL do so without leaving the
pop-out's own address.

#### Scenario: Navigating away is refused

- **WHEN** something in a pop-out attempts to navigate the window to ordinary content
- **THEN** the navigation is refused and the developer is told

#### Scenario: Moving within the work stays inside

- **WHEN** work in a pop-out switches between its own sub-views
- **THEN** the window's address stays a pop-out address

### Requirement: Only commands that declare themselves suitable are offered

In a pop-out, a command SHALL be offered only if it declares that it belongs there, and this SHALL
hold for every trigger alike. Searching over open work SHALL not be offered at all, since a pop-out
has no strip of open work.

#### Scenario: The command search is much shorter

- **WHEN** the user opens the command search in a pop-out
- **THEN** only commands declaring themselves suitable are offered

#### Scenario: Searching open work is absent

- **WHEN** the user asks for the search over open work in a pop-out
- **THEN** nothing opens, because there is no open work to search

### Requirement: Access rules apply, and explain rather than redirect

Work the session may not see SHALL be refused in a pop-out as anywhere else, and SHALL explain
itself in place. It SHALL NOT be redirected to a sign-in destination, because a chrome-less window
is not somewhere a user can sign in.

#### Scenario: A refused pop-out explains itself in place

- **WHEN** a pop-out is opened for work the session does not qualify for
- **THEN** the window explains why and does not redirect

### Requirement: A blocked window is recoverable

Where the browser prevents the window from opening, the workbench SHALL tell the user and offer to
try again, so that the retry carries a fresh user gesture. Dismissing SHALL leave everything as it
was.

#### Scenario: A blocked pop-up is offered a retry

- **WHEN** the browser blocks the window
- **THEN** the user is told and offered to try again

#### Scenario: Declining changes nothing

- **WHEN** the user dismisses that offer
- **THEN** nothing is opened and nothing changes
