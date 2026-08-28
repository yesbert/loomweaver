# persistence-ports Specification

## Purpose
The workbench remembers a great deal — what the user chose, how they arranged their work, what a
plugin was in the middle of — and none of it may be assumed to live in the browser. Everything goes
through ports a product can implement against its own backend, and the workbench keeps local
defaults so that it also runs with nothing behind it.

## Requirements

### Requirement: Everything the workbench remembers goes through a port

The workbench SHALL read and write persisted state only through replaceable ports, and SHALL ship
device-local implementations so that an application with no backend works unchanged. Replacing a
port SHALL require no other change.

#### Scenario: An application with no backend still remembers

- **WHEN** a distribution provides no store of its own
- **THEN** the workbench persists to device-local storage

#### Scenario: A product's own store takes over completely

- **WHEN** a distribution provides its own store
- **THEN** every read and write goes through it

### Requirement: Settings and working state are two separate ports

What the user deliberately chose and what the workbench happens to be doing SHALL be stored through
two different ports, so a product can send one to its backend without the other. Replacing one
SHALL leave the other alone.

#### Scenario: A product backs settings with its backend and leaves working state local

- **WHEN** a distribution replaces only the settings port
- **THEN** chosen preferences go to its backend
- **AND** layout and scratch state stay device-local

#### Scenario: The two ports do not read each other

- **WHEN** state registered against one port changes
- **THEN** it is read back from that port, never from the other

### Requirement: A write is best-effort and never breaks the workbench

A store that fails to write SHALL NOT propagate the failure into the workbench. Persistence is a
convenience, and a full disk, a private-browsing restriction or an unreachable backend must not
leave the user with a broken application.

#### Scenario: A failing write is absorbed

- **WHEN** the store throws or rejects while writing
- **THEN** the operation completes and the workbench carries on

#### Scenario: A failing read is treated as "nothing stored"

- **WHEN** a read rejects
- **THEN** the workbench uses its default and reports no unhandled failure

### Requirement: A store that answers only asynchronously does not lose the value

A store MAY answer synchronously, and where it does the workbench SHALL use that answer before the
first paint. Where it cannot, the workbench SHALL start at its default and adopt the stored value
once it arrives, without writing that value back.

Whether a store answers synchronously SHALL be detectable, because the two paths differ; a wrapper
around a store MUST NOT make an asynchronous store look synchronous or the reverse.

#### Scenario: A synchronous store is honoured before the first paint

- **WHEN** the store can answer synchronously
- **THEN** the workbench renders with the stored value rather than the default

#### Scenario: A network-backed store is adopted once it answers

- **WHEN** the store answers only asynchronously
- **THEN** the workbench starts at its default and switches when the answer arrives
- **AND** it does not write the adopted value back

#### Scenario: A wrapper does not disguise the store it wraps

- **WHEN** a store without a synchronous answer is wrapped
- **THEN** the wrapper has no synchronous answer either

### Requirement: Stored state belongs to the person it was stored for

Where a product supplies an identity, the workbench SHALL keep each identity's state apart, and
SHALL keep an anonymous namespace apart from every signed-in one. State that belongs to the device
rather than the person — the chosen theme, language and text size — SHALL stay outside that
separation, and which keys those are SHALL be selectable by the product.

#### Scenario: Two people on one device do not see each other's state

- **WHEN** two identities use the application in turn
- **THEN** each finds the state it left behind

#### Scenario: Device-level choices survive a change of person

- **WHEN** the identity changes
- **THEN** the chosen theme, language and text size are unchanged

#### Scenario: An identity containing separator characters is kept distinct

- **WHEN** an identity contains characters the key format uses
- **THEN** it is encoded so that it cannot collide with another identity

### Requirement: The namespace is fixed for the lifetime of a session

The workbench SHALL decide which identity's namespace it writes to once, when the session begins,
and SHALL keep writing there until the application reloads. A change of person therefore takes
effect across a reload rather than mid-session.

The one exception SHALL be the first sign-in of an anonymous session, which may adopt the new
namespace directly.

#### Scenario: A mid-session change of person does not scatter state

- **WHEN** the identity changes while the application is running
- **THEN** writes still land in the namespace the session started with

#### Scenario: Signing in for the first time adopts the namespace

- **WHEN** an anonymous session signs in
- **THEN** subsequent writes land in that identity's namespace

#### Scenario: Signing out does not release the namespace

- **WHEN** the user signs out
- **THEN** writes still land in the namespace of the session, not in the anonymous one

### Requirement: A change made in one window reaches the others

Where the same application is open more than once, a change to state a product registered as shared
SHALL reach the other windows without a reload. The other window SHALL read the value back through
the port rather than trusting what was sent, so that a product's own store stays the only source.

A product SHALL be able to announce a change to state it persists outside the ports, and to trigger
the same reaction from a backend push.

#### Scenario: Another window adopts the change

- **WHEN** shared state changes in one window
- **THEN** another window applies it without a reload

#### Scenario: The receiving window does not echo it back

- **WHEN** a window adopts a change from another
- **THEN** it does not write that value back

#### Scenario: State outside the ports can join the same mechanism

- **WHEN** a product announces a key it persists itself
- **THEN** windows with a registered reaction apply it

#### Scenario: Arrangement stays a property of the window

- **WHEN** the user rearranges their panes in one window
- **THEN** the other window's arrangement is unchanged

### Requirement: A plugin has a private place to keep working state

A plugin SHALL be able to keep working state under keys of its own choosing, isolated from every
other plugin, and SHALL be able to observe it so that two of its surfaces — including ones in
different windows — see the same value. This SHALL require no capability, because a plugin can
reach only its own namespace by construction.

The store SHALL be for working state only, and it SHALL be removed when the plugin is uninstalled.

#### Scenario: Two surfaces of one plugin share a value live

- **WHEN** one surface of a plugin writes a key and another observes it
- **THEN** the second sees the new value

#### Scenario: Two plugins using the same key name do not collide

- **WHEN** two plugins write the same key name
- **THEN** each reads back only its own value

#### Scenario: Uninstalling a plugin takes its state with it

- **WHEN** a plugin is uninstalled
- **THEN** everything it stored is removed

#### Scenario: An observer knows whether the value has arrived

- **WHEN** a plugin observes a key backed by a store that answers only asynchronously
- **THEN** it can tell that the value has not arrived yet, and is told when it has

### Requirement: A plugin's private store has limits, and refuses rather than degrades

The private store SHALL cap how large a single value may be and how many keys one plugin may hold,
and SHALL refuse what exceeds them rather than writing something the store cannot carry. An empty
key SHALL be refused.

#### Scenario: An oversized value is refused

- **WHEN** a plugin writes a value larger than the cap
- **THEN** the write is refused and nothing is stored

#### Scenario: Too many keys are refused

- **WHEN** a plugin creates more keys than the cap allows
- **THEN** the additional key is refused

### Requirement: A surface instance keeps its own state, and can be reset

A mounted surface SHALL be able to store state that belongs to that instance of it, restored when
the instance is shown again. Rapid changes SHALL be collapsed into one write, unreadable stored
state SHALL be ignored rather than propagated, and the user SHALL be able to reset an instance to
its defaults without a reload.

#### Scenario: Instance state survives being hidden and shown

- **WHEN** a surface instance stores state and is hidden and shown again
- **THEN** it is restored

#### Scenario: Rapid changes cost one write

- **WHEN** state changes several times in quick succession
- **THEN** it is persisted once

#### Scenario: Unreadable stored state does not break the surface

- **WHEN** the stored state cannot be read
- **THEN** the surface starts at its defaults

#### Scenario: Resetting takes effect immediately

- **WHEN** the user resets an instance's state
- **THEN** the surface falls back to its defaults without a reload
- **AND** the stored state is removed, and a pending write does not resurrect it
