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

### Requirement: Two commands a user can reach are told apart by their names

Where the workbench offers more than one command in the same list, no two of the commands it ships
SHALL present the same name in any language it ships. A name SHALL say what its own command does, so
that two commands whose effects differ do not differ only by a word one of them leaves out.

One command SHALL present one name. Where the same command is reached from more than one control,
every control SHALL label it alike, because a second label for one command cannot be told, by the
person reading it, from a second command.

The limit of this guarantee: it holds for the commands the workbench itself registers and for the
languages it ships. A product that registers its own commands, or rewords the shipped ones, owns
whatever collision it creates, and the workbench does not police it at runtime.

#### Scenario: Two commands that reset different things say which they reset

- **WHEN** the workbench offers a command that resets the application's own arrangement and a command
  that resets the active workspace
- **THEN** each name says which of the two it resets
- **AND** neither carries a name the other could equally have

#### Scenario: One command is labelled the same wherever it is offered

- **WHEN** the same command is reachable from a settings control and from the command search
- **THEN** both present the same name

#### Scenario: A collision is caught before it ships

- **WHEN** two of the shipped commands would present the same name in a shipped language
- **THEN** that is a defect the repository's own checks report, rather than something a user
  discovers by running the wrong one

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

#### Scenario: An action chosen in the search acts where the work stands

- **WHEN** the user opens the actions of open work held by a pane that does not carry the address,
  and chooses to close it, to pin it or to close what lies to its right
- **THEN** that happens in the pane that holds it, as from that pane's own tab menu
- **AND** the tabs of the address-carrying pane are untouched, and closing the work runs its owner's
  teardown once

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

### Requirement: The search over open work is reachable without knowing its shortcut

A distribution SHALL be able to place a visible entry point to the search over open work in its
chrome, showing the shortcut that also opens it, and sized to match its neighbours in the bar it
sits in. It SHALL be placeable independently of the entry point to the command search, so that a
product may offer either, both, or neither, and may put each in a different bar.

#### Scenario: The visible entry point opens the search over open work

- **WHEN** the user activates the entry point
- **THEN** the search over open work opens, in that mode and not as the command search

#### Scenario: The entry point fits its bar

- **WHEN** the entry point is placed in a bar
- **THEN** its height matches the other controls of that bar

#### Scenario: Either search may be offered without the other

- **WHEN** a distribution places the entry point to one search and not the other
- **THEN** only the placed one appears

### Requirement: A visible entry point does not outlive the search it opens

A visible entry point to a search SHALL be shown only while that search is reachable for the current
user. Where the distribution has removed the search, or the session may not run it, the entry point
SHALL be absent rather than present and inert, so that no control offers a route the workbench has
already closed.

The limit of this guarantee: switching off the shortcut layer does not close the route. The entry
point SHALL remain, because activating it still opens the search; it SHALL simply advertise no
chord, in keeping with nothing advertising a key that does nothing.

#### Scenario: Removing the search removes its entry point

- **WHEN** a distribution removes a search from its chrome
- **THEN** the visible entry point to that search is gone as well, and no control remains that does
  nothing when activated

#### Scenario: A session that may not search sees no entry point

- **WHEN** the session does not meet what the search requires of it
- **THEN** the entry point to that search is not shown

#### Scenario: Without shortcuts the entry point stays and promises nothing

- **WHEN** a distribution switches the shortcut layer off
- **THEN** the entry point is still shown and still opens the search
- **AND** it names no chord

### Requirement: A command may take described arguments and give an answer

A command MAY declare the arguments it accepts and MAY answer with a result. What it declares SHALL
be discoverable without running it: each argument SHALL carry a name, the kind of value it takes,
whether it is required, and a description of what it means.

Both the arguments and the answer SHALL be plain data, because they cross the boundary between a
plugin and the workbench unchanged. A value that cannot be carried as data SHALL be refused rather
than arriving stripped of what it was.

A command that declares no arguments SHALL keep working exactly as it does today, invoked with none.

An argument MAY offer a set of choices, and a value outside them SHALL be refused before the command
runs. For a command registered by a plugin running in the page, the choices SHALL be read each time
the command is described or its arguments are checked, so that a choice which exists only after the
command was registered is offered and accepted. A command registered by an isolated plugin SHALL
carry the choices it declared when it registered, because its declaration crosses the boundary once;
it offers new choices by registering the command again.

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

#### Scenario: A choice that appears after registration is offered and accepted

- **WHEN** a plugin running in the page registers a command whose choices grow afterwards, and the
  command is described, or invoked with a choice that was added later
- **THEN** the description lists the added choice, and the invocation runs

#### Scenario: An isolated plugin's choices are the ones it registered

- **WHEN** an isolated plugin registers a command with a set of choices
- **THEN** exactly those choices are offered and accepted until it registers the command again

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

### Requirement: A command may say what an agent's word is enough for

A command SHALL be able to state what running it on an agent's word alone amounts to, as one of four
statements: that the agent's word is enough; that the person is asked first; that the person is asked
every time it is called; or that it is not to be run on an agent's word at all. A command that states
nothing states nothing, which is the default and means what the platform does today.

The statement SHALL travel with the command wherever the workbench accounts for it to something other
than the person at the keyboard: a caller that enumerates the commands it may invoke SHALL read it
there, and a description of a command written for an agent choosing between actions SHALL carry it
beside what the command does, what it takes and what it answers.

**The platform states this and does not enforce it**, exactly as a command's access requirement is a
statement about presentation rather than protection. Nothing is asked on the product's behalf, no
answer is remembered, and no invocation is refused on this account: a command that says the person is
asked first still runs when invoked, whoever invoked it. Asking, and remembering an answer, belong to
whoever runs commands on an agent's behalf, because only a product knows how it talks to its users. A
command that must be beyond an agent's reach is put there by not opening it to foreign callers at
all, which the platform does enforce.

The statement SHALL NOT widen anything. A command that opens itself to foreign callers and states
that the agent's word is enough is reachable exactly where it was reachable before.

#### Scenario: What a command says is read back where a caller enumerates commands

- **WHEN** a caller lists the commands it may invoke and one of them states what an agent's word is
  enough for
- **THEN** the listed entry carries that statement

#### Scenario: A command that says nothing carries nothing

- **WHEN** a caller lists a command that states nothing about an agent's word
- **THEN** the entry carries no such statement, and the command is offered as it is today

#### Scenario: A description written for an agent carries the statement

- **WHEN** a command that states something about an agent's word is described for an agent to choose
  from
- **THEN** the description carries that statement beside what the command does

#### Scenario: The statement refuses nothing by itself

- **WHEN** a command stating that the person is asked every time is invoked by identity, with nobody
  asked
- **THEN** it runs, because the statement is not a gate

#### Scenario: Out of reach is still expressed by not opening the command

- **WHEN** a command states that it is not to be run on an agent's word and is open to foreign
  callers
- **THEN** it is still listed and still runs when invoked, and closing it to foreign callers is what
  puts it out of reach

### Requirement: Invocations waiting side by side are not a chain

The workbench SHALL refuse an invocation by identity that continues a chain of invocations too deep
to be anything but a loop. A chain SHALL be counted only where one command is invoked from within
another command's run before that run first waits for anything. Invocations that run side by side,
each waiting for something such as the user's answer, SHALL NOT count towards the limit, so that any
number of them can be pending while an unrelated command is invoked.

The limit stops a command that invokes itself, directly or through others, without waiting in
between. It SHALL NOT be relied on to stop a loop whose steps each wait before invoking the next;
such a loop is the invoking plugin's own behaviour.

#### Scenario: Pending invocations do not block an unrelated one

- **WHEN** more invocations than the chain limit allows are each waiting for the user, and another
  command is invoked
- **THEN** it runs

#### Scenario: A command that keeps invoking itself is stopped

- **WHEN** a command invokes itself from within its own run, again and again, without waiting in
  between
- **THEN** the invocation beyond the limit is refused as too deep, and the refusal reaches the caller

### Requirement: The connection an agent drives answers every call it opened

The connection that runs the workbench's commands for an agent SHALL answer every call the agent
opened, including the calls still open when the agent's run ends, because an agent that sent calls
expects an answer to each and most agents will not continue without them. When a run ends, the
connection SHALL answer the calls left open one at a time, each time it is asked, until none is left,
so that a consumer which asks until nothing is answered has answered all of them.

A call still open when the run ends never received all of its arguments. It SHALL be answered as
refused, saying why, and the command it named SHALL NOT run. The one exception is a call carried in
the protocol's shorter form, which has no closing of its own: a run that finishes closes it, and it
runs; a run that fails does not, and it is refused.

#### Scenario: Every call left open is answered

- **WHEN** a run ends with three calls whose closing never arrived, and the consumer asks until
  nothing is answered
- **THEN** each of the three is answered exactly once, and the next request answers nothing

#### Scenario: A call left open does not run

- **WHEN** a run ends with a call whose closing never arrived
- **THEN** it is answered as refused, and the command it named does not run

#### Scenario: A call without a closing of its own is closed by the run

- **WHEN** a call arrives in the protocol's shorter form, which has no closing event, and the run
  finishes
- **THEN** it runs, and it is refused instead where the run fails

#### Scenario: A call that closed runs as before

- **WHEN** a call closes before the run ends
- **THEN** its command runs and its outcome is the answer, as before
