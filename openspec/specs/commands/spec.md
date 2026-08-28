# commands Specification

## Purpose
A command is a named action with one implementation, which the user can reach from a button, a
keystroke or by searching for it. Keeping those as three views of one thing is what stops the same
action from behaving differently depending on how it was invoked — and it is what makes a keyboard
shortcut and a palette entry free for anything a plugin contributes.

## Requirements

### Requirement: One action, many triggers

A plugin SHALL register a command once, and any control MAY point at it by its identity instead of
carrying its own implementation. Where a control names a command, that command SHALL be what runs.
A control MAY still carry an inline implementation, and where it does both, the named command wins.

#### Scenario: A button and a keystroke run the same thing

- **WHEN** a control names a command and the command declares a shortcut
- **THEN** pressing the control and pressing the shortcut do the same thing

#### Scenario: An unknown command is reported, not silently ignored

- **WHEN** a control names a command nothing registered
- **THEN** nothing runs and the developer is told

#### Scenario: A control that leads nowhere is not offered

- **WHEN** a control names neither a registered command nor an inline implementation
- **THEN** it is not treated as usable

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

### Requirement: A command may carry a shortcut, expressed once for every platform

A command MAY declare a keyboard shortcut in a platform-neutral form, and the workbench SHALL bind
and display it in the spelling of the platform it is running on. Bindings SHALL follow the registered
commands, so a shortcut appears and disappears with the plugin that owns it.

Matching SHALL use the physical key, so that a shortcut combining a modifier with a digit or a
letter still matches where the modifier changes the character produced.

#### Scenario: One declaration works on every platform

- **WHEN** a command declares a shortcut using the neutral modifier
- **THEN** it binds to the platform's own modifier and is displayed in that platform's spelling

#### Scenario: A modifier that changes the character still matches

- **WHEN** a shortcut combines a modifier with a digit or a letter and the modifier changes the
  character the keyboard produces
- **THEN** the shortcut still matches

#### Scenario: Shortcuts follow the commands

- **WHEN** a plugin is deactivated
- **THEN** its shortcuts stop working

#### Scenario: A clash is reported and resolved predictably

- **WHEN** two commands declare the same shortcut
- **THEN** the developer is told, and the later registration wins

### Requirement: Typing is not hijacked

A shortcut without a modifier SHALL NOT fire while the user is typing in a field. A shortcut with a
modifier SHALL still fire.

#### Scenario: A plain key does not fire while typing

- **WHEN** the user types in a text field and presses a key that is a shortcut on its own
- **THEN** the character is typed and the command does not run

#### Scenario: A modifier shortcut still works while typing

- **WHEN** the user presses a shortcut with a modifier while typing
- **THEN** the command runs

### Requirement: Every command a user may run is findable by searching

The workbench SHALL offer a search over the commands available to the user, listing them by their
translated name, matching a typed subsequence rather than only a contiguous run, and reachable by
keyboard throughout.

A command MAY declare that it should not appear there, for actions that only make sense against a
thing the user right-clicked.

#### Scenario: A command is found by typing part of it

- **WHEN** the user types letters that occur in a command's name in order
- **THEN** the command is offered even if the letters are not adjacent

#### Scenario: The search reflects who is signed in

- **WHEN** the session does not qualify for a command
- **THEN** it is not offered, and it appears once the session qualifies

#### Scenario: A context-only command is not offered

- **WHEN** a command declares that it is context-only
- **THEN** it does not appear in the search

#### Scenario: The search opens and works before translations arrive

- **WHEN** the search is opened before the translation bundle has loaded
- **THEN** it re-labels itself once the bundle arrives rather than showing raw keys

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

### Requirement: Open work is searchable in its own mode

The workbench SHALL offer a second search over open work, distinct from the command search and
reached by its own gesture. It SHALL list what is open, most recently active first, and choosing one
SHALL reveal it where it is. It SHALL offer the actions of a piece of open work without leaving the
search.

#### Scenario: The two searches do not mix

- **WHEN** the user opens the command search
- **THEN** it lists commands and not open work

#### Scenario: Open work is listed by recency

- **WHEN** the user opens the search over open work
- **THEN** the most recently active is first

#### Scenario: Actions are reachable without leaving

- **WHEN** the user asks for the actions of a highlighted piece of open work
- **THEN** its menu opens at that row

### Requirement: A window of its own offers only what makes sense there

In a window showing a single piece of work, a command SHALL be offered only if it declares that it
belongs there. This SHALL hold for every trigger alike, so that a command withheld from the search
cannot be reached by its shortcut either.

#### Scenario: An ordinary command is not offered in a detached window

- **WHEN** a command that does not declare itself suitable is triggered in a window of its own
- **THEN** it does not run, by any route

#### Scenario: A command that declares itself suitable works there

- **WHEN** a command declaring that it belongs in a detached window is triggered there
- **THEN** it runs

### Requirement: The palette is reachable without knowing the shortcut

A distribution SHALL be able to place a visible entry point to the command search in its chrome,
showing the shortcut that also opens it, and sized to match its neighbours in the bar it sits in.

#### Scenario: The visible entry point opens the search

- **WHEN** the user activates the entry point
- **THEN** the command search opens

#### Scenario: The entry point fits its bar

- **WHEN** the entry point is placed in a bar
- **THEN** its height matches the other controls of that bar

### Requirement: A command may take described arguments and give an answer

A command MAY declare the arguments it accepts and MAY answer with a result. What it declares SHALL
be discoverable without running it: each argument SHALL carry a name, the kind of value it takes,
whether it is required, and a description of what it means.

Both the arguments and the answer SHALL be plain data, because they cross the boundary between a
plugin and the workbench unchanged. A value that cannot be carried as data SHALL be refused rather
than arriving stripped of what it was.

A command that declares no arguments SHALL keep working exactly as it does today, invoked with none.

#### Scenario: What a command takes is discoverable before it runs

- **WHEN** a caller asks what a command accepts
- **THEN** it is told each argument's name, the kind of value it takes, whether it is required, and
  what it means, without the command running

#### Scenario: A command that declares nothing is unaffected

- **WHEN** a command that declares no arguments is triggered
- **THEN** it runs as it did before, with no arguments

#### Scenario: A missing required argument is refused

- **WHEN** a command is invoked without an argument it declares as required
- **THEN** it is refused and the command does not run

#### Scenario: An argument of the wrong kind is refused

- **WHEN** a command is invoked with an argument whose value is not of the declared kind
- **THEN** it is refused and the command does not run

#### Scenario: A value that is not data does not cross

- **WHEN** a sandboxed plugin invokes a command with an argument that cannot be carried as data
- **THEN** the invocation is refused, rather than the command running against a value that lost
  what it was

### Requirement: A command may be described for a reader that is not looking at the screen

A command MAY carry a description separate from the title the workbench draws. The title exists to
label a control; the description exists to explain the action to something choosing between actions.
The description MAY be given either as a translation key or as a literal.

A command with no description SHALL be left without one rather than being given the title in its
place, because a label is not an explanation.

#### Scenario: The description is not the label

- **WHEN** a command carries both a title and a description
- **THEN** the workbench draws the title on controls, and offers the description where an action is
  being explained rather than labelled

#### Scenario: A command without a description is not given a substitute

- **WHEN** a command carries no description
- **THEN** it has none, and its title is not presented as one

### Requirement: A command is closed to callers other than its own plugin unless it says otherwise

A command SHALL declare whether a caller other than the plugin that registered it may invoke it. The
default SHALL be that it may not: an undeclared command is unreachable to a foreign caller, by every
route, and is absent from anything that lists what such a caller may reach.

The plugin that registered a command SHALL always be able to invoke its own, and SHALL need no
declaration and no grant to do so.

The declaration SHALL open nothing further. A command that declares itself open is still subject to
every rule that already governs it, so a session that does not qualify for it cannot reach it that
way either.

#### Scenario: An undeclared command is unreachable to a foreign caller

- **WHEN** a plugin invokes a command registered by another plugin that has not declared itself open
- **THEN** it is refused and the command does not run

#### Scenario: A plugin reaches its own commands regardless

- **WHEN** a plugin invokes a command it registered itself, which declares nothing
- **THEN** it runs

#### Scenario: Declaring openness does not bypass access gating

- **WHEN** a command declares itself open and the session does not meet its access requirement
- **THEN** a foreign caller naming it is refused, exactly as every other trigger would be

### Requirement: A command invoked by identity answers the caller that invoked it

A caller MAY invoke a command by its identity and SHALL receive what it answered. The invocation
SHALL run through the one place every trigger already runs through, so access gating, the rule about
a window showing a single piece of work and failure reporting apply to it unchanged.

A refusal SHALL reach the caller as a refusal, and a failure SHALL reach the caller as a failure,
distinguishable from each other and from an answer. Reaching the caller SHALL NOT replace the
existing duty to surface a refusal to the user.

Naming a command nothing registered SHALL be refused rather than silently doing nothing.

#### Scenario: The answer reaches the caller

- **WHEN** a caller invokes a command that answers with a result
- **THEN** it receives that result

#### Scenario: A refusal and a failure are told apart

- **WHEN** a caller invokes a command it may not reach, and separately invokes one that throws
- **THEN** it can tell the refusal from the failure, and neither is presented as an answer

#### Scenario: A refusal still reaches the user

- **WHEN** a caller is refused a command for lack of permission
- **THEN** the user is told, as they already are for every other route

#### Scenario: A command that does not belong in a detached window is not reachable there

- **WHEN** a caller in a window showing a single piece of work invokes a command that has not
  declared itself suitable there
- **THEN** it is refused and the command does not run

#### Scenario: An unknown identity is refused

- **WHEN** a caller invokes a command nothing registered
- **THEN** it is refused, rather than the call appearing to succeed

### Requirement: What a caller may reach can be enumerated, already narrowed

The workbench SHALL be able to list the commands a given caller may invoke, in a predictable order,
so that a caller can offer them onward without keeping a list of its own. The list SHALL hold the
commands that declared themselves open, whoever registered them, and SHALL already be narrowed by
every rule that would refuse the invocation: whether the session meets the command's access
requirement, whether it belongs in the window the caller is in, and — for a command the caller does
not own — what the calling plugin has been granted.

The list SHALL follow the registered commands, so an entry appears and disappears with the plugin
that owns it, and SHALL follow the session, so an entry appears once the session qualifies for it.

Everything the list holds SHALL run when invoked, and anything the seam would refuse SHALL be absent
from it, so that the list is never a wider account than the seam. The reverse is not guaranteed: a
plugin's commands that it never opened are its own behaviour, and it reaches them whether or not
they are listed.

#### Scenario: The list holds only what would actually run

- **WHEN** a caller lists the commands it may invoke
- **THEN** every entry is one that would run if invoked, and nothing that would be refused is listed

#### Scenario: A command the session does not qualify for is absent, and appears when it does

- **WHEN** the session does not meet a command's access requirement
- **THEN** it is not listed, and it is listed once the session meets it

#### Scenario: The list follows the plugins

- **WHEN** the plugin that registered a listed command is deactivated
- **THEN** the command is no longer listed

#### Scenario: A detached window lists only what belongs there

- **WHEN** a caller in a window showing a single piece of work lists what it may invoke
- **THEN** only commands that declared themselves suitable there are listed

#### Scenario: A command that never opened itself is not listed to its own plugin either

- **WHEN** a plugin lists what it may invoke and it registered a command that declares nothing
- **THEN** that command is not listed
- **AND** the plugin still reaches it by invoking it
