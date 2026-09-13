# ui-primitives Specification

## Purpose
The workbench offers the pieces a plugin would otherwise build for itself: asking a question,
reporting something, showing progress, and a set of controls that look and behave like the rest of
the application. Offering them well is what makes the declarative path attractive — a plugin that
brings its own widget stack is a patchwork nobody wanted, and the way to prevent it is to make
borrowing better than building.

## Requirements

### Requirement: A plugin can ask, tell and report progress without building a dialog

The workbench SHALL offer a plugin the means to ask a yes-or-no question, to state something for
acknowledgement, to ask for a line of text, and to show progress — each returning a result the
plugin can await. It SHALL also let a plugin mount its own content in a workbench-framed dialog.

#### Scenario: A question resolves to what the user chose

- **WHEN** a plugin asks a question
- **THEN** it resolves to confirmation only when the user confirmed, and to refusal when they
  dismissed it by any means

#### Scenario: Asking for text returns it, or nothing

- **WHEN** a plugin asks for a line of text
- **THEN** it receives what was typed, or an explicit nothing if the user dismissed it

#### Scenario: Progress cannot be dismissed by accident

- **WHEN** a plugin shows progress
- **THEN** the dialog cannot be dismissed, its text can be updated, and it closes when told

#### Scenario: Progress around a piece of work closes with it

- **WHEN** a plugin wraps work in a progress dialog
- **THEN** the dialog closes when the work settles, whether it succeeded or failed

### Requirement: A dialog looks like what it is

A dialog SHALL be able to declare its tone, from which the workbench SHALL derive its accent and its
leading symbol, so that a destructive question is visibly different from a neutral one. A dialog
with nothing to signal SHALL carry no symbol.

#### Scenario: A destructive question is visibly destructive

- **WHEN** a dialog declares a destructive tone
- **THEN** its confirming control and its symbol reflect that

#### Scenario: A neutral dialog carries no symbol

- **WHEN** a dialog declares no tone
- **THEN** no leading symbol is drawn

### Requirement: A question may require the user to mean it

A dialog SHALL be able to require confirmation beyond a click — the user typing something to
proceed — and the confirming control SHALL stay unavailable until that is satisfied. The check SHALL
be supplied by the caller, which MAY refuse with a reason shown to the user, or refuse silently.

#### Scenario: Confirming stays unavailable until the requirement is met

- **WHEN** a dialog requires confirmation and the requirement is unmet
- **THEN** the confirming control cannot be used, and the reason is shown

#### Scenario: A silent refusal blocks without scolding

- **WHEN** the check refuses without giving a reason
- **THEN** confirming remains unavailable and no message is shown

### Requirement: A dialog holds focus and gives it back

While a dialog is open, keyboard focus SHALL stay within it in both directions, and on closing it
SHALL return to what had focus before. A dialog SHALL be able to align itself to the top of the
viewport rather than the centre, for content whose height changes as the user types.

#### Scenario: Focus cycles within the dialog

- **WHEN** the user moves focus past the last control, or backwards past the first
- **THEN** focus wraps within the dialog

#### Scenario: A dialog whose content grows does not jump

- **WHEN** a dialog declares itself top-aligned
- **THEN** it is pinned to the top rather than re-centring as its height changes

### Requirement: A plugin can raise a notice without owning where notices appear

A plugin SHALL be able to raise a transient notice with a kind, and the workbench SHALL place and
announce it. A notice raised by a plugin SHALL be identified in a way that cannot collide with the
workbench's own or with another plugin's.

#### Scenario: Two plugins raising notices do not collide

- **WHEN** two plugins raise notices using the same identity of their own
- **THEN** neither replaces the other's

### Requirement: The workbench's controls are usable from any technology

The workbench SHALL offer its visual vocabulary as elements usable by tag from any technology, and
as named style classes for controls that already exist natively. A plugin SHALL be able to use them
without depending on the workbench's own framework, including from a surface running isolated from
it.

Every element the workbench offers by tag SHALL be registrable by whoever renders it, from the
published surface, and not only by a running workbench. An element nobody registered draws nothing
and raises no error, so an element that cannot be registered outside the workbench fails its
consumer's tests without saying so. This holds for host-rendered content; an isolated surface
receives the elements from the workbench and registers nothing itself.

#### Scenario: A plugin uses a workbench control by tag

- **WHEN** a plugin's own content uses one of the workbench's elements by tag
- **THEN** it renders and behaves as it does in the workbench's own chrome

#### Scenario: An isolated surface uses them too

- **WHEN** a surface running isolated from the workbench uses the same elements
- **THEN** they render and behave the same, and take the workbench's current appearance

#### Scenario: A native control is styled rather than wrapped

- **WHEN** a plugin needs a control the browser already provides
- **THEN** the workbench offers a style class for it rather than an element that reimplements it

#### Scenario: Content using an element renders without a running workbench

- **WHEN** content that uses any element the workbench offers by tag is rendered without a running
  workbench, as under a unit test
- **AND** the consumer registers that element from the published surface
- **THEN** the element is drawn

### Requirement: An element behaves correctly however it is driven

An element SHALL accept its configuration both as an attribute and as a property, SHALL reflect
changes made after it is on screen, and SHALL cope with a property set before it was upgraded.

#### Scenario: A value set before the element was ready is not lost

- **WHEN** a property is set on an element before its definition has loaded
- **THEN** the value takes effect once it does

#### Scenario: Changing a value re-renders

- **WHEN** an element's configuration changes while it is on screen
- **THEN** it re-renders

### Requirement: The workbench draws a navigation tree from what a consumer declares

The workbench SHALL offer a navigation tree among its elements: a consumer declares destinations and
the workbench draws them, marks where the user is, and reports what the user chose.

The tree SHALL take its shape from the declaration rather than from a rule of thumb. A destination
MAY stand on its own, outside any group, and a group that is declared SHALL be drawn as a group even
where it holds a single destination. Nothing SHALL be promoted, merged or flattened on the
workbench's judgement, because a sidebar whose shape shifts with its contents is one the user cannot
learn.

Text SHALL arrive ready to display. The tree SHALL NOT translate what it is given, and a consumer
that changes language supplies the changed text.

The limit of that: the tree draws destinations and knows nothing of what they mean. It carries no
vocabulary of the products built on it, and choosing a destination is reported rather than acted on,
so nothing the tree does can move the user on its own.

#### Scenario: A group holding one destination is still a group

- **WHEN** a consumer declares a group with exactly one destination in it
- **THEN** the tree draws it as a group with one destination, not as a destination on its own

#### Scenario: A destination may stand outside every group

- **WHEN** a consumer declares a destination that belongs to no group
- **THEN** the tree draws it at the top level, beside the groups

#### Scenario: Choosing a destination is reported, not acted on

- **WHEN** the user chooses a destination
- **THEN** the tree reports which one, and nothing else happens until the consumer acts on it

#### Scenario: The declaration changing while the tree is on screen changes what is drawn

- **WHEN** a consumer adds, removes or renames a destination while the tree is on screen
- **THEN** the tree draws the new declaration

### Requirement: The navigation tree marks the destination the current address lies under

A consumer SHALL be able to tell the navigation tree which address is currently shown, and the tree
SHALL mark the destination that address lies at or under, applying the same segment rule the
workbench applies when a plugin asks the question directly. An address is under a destination only
where the destination's address is a whole prefix of it and not merely the start of its text.

The tree SHALL mark at most one destination, and SHALL mark none where the current address lies
under no destination it was given. The marking SHALL be announced to assistive technology as the
current item and not by appearance alone.

#### Scenario: A deeper address marks the destination it lies under

- **WHEN** the address shown lies below a destination the tree holds
- **THEN** that destination is marked

#### Scenario: A longer name is not a deeper address

- **WHEN** the address shown merely begins with a destination's address, without a segment boundary
  between them
- **THEN** that destination is not marked

#### Scenario: An address under nothing marks nothing

- **WHEN** the address shown lies under no destination the tree holds
- **THEN** no destination is marked

#### Scenario: Moving marks the destination moved to

- **WHEN** the address the consumer reports changes while the tree is on screen
- **THEN** the marking moves with it

### Requirement: A group folds, and stays as the user left it for the session

A group SHALL fold open and shut on the user's command, and the declaration SHALL be able to say
whether a group starts open or shut. Where the declaration says nothing, a group SHALL start open,
because a sidebar that hides everything until it is opened tells a first-time user nothing.

What the user folded SHALL survive for as long as the session lasts, including the tree being drawn
again after being taken off screen, so that following a link does not undo the shape the user made.

A group holding no destinations SHALL still be drawn, because the consumer declared it, and SHALL
offer no fold: a control that opens nothing is a promise the group cannot keep. Where destinations
arrive later, the fold SHALL be offered from then on.

The limit of that: nothing is kept beyond the session. The tree stores nothing of its own, so a
reload starts from what the declaration says.

#### Scenario: A group starts as the declaration says

- **WHEN** a consumer declares a group as starting shut
- **THEN** it is drawn shut, and its destinations are not on screen until the user opens it

#### Scenario: A group with nothing said about it starts open

- **WHEN** a consumer declares a group without saying whether it starts open
- **THEN** it is drawn open

#### Scenario: What the user folded outlives the tree leaving the screen

- **WHEN** the user shuts a group, the tree is taken off screen, and it is drawn again
- **THEN** the group is still shut

#### Scenario: A group with nothing in it offers no fold

- **WHEN** a consumer declares a group holding no destinations
- **THEN** the group is drawn and its heading offers nothing to fold

#### Scenario: A reload starts from the declaration again

- **WHEN** the session ends and the consumer draws the tree again
- **THEN** every group is as the declaration says, not as the user last left it

### Requirement: Anything a plugin supplies for rendering is sanitised

Content a plugin supplies to be rendered as markup — a symbol, a piece of formatted text — SHALL be
sanitised before it reaches the document. Scripts, event handlers and script-bearing links SHALL be
removed, and something that does not survive sanitisation at all SHALL be dropped rather than
rendered empty.

#### Scenario: A symbol carrying a script is cleaned

- **WHEN** a plugin contributes a symbol containing a script or an event handler
- **THEN** it is rendered without them

#### Scenario: Formatted text cannot introduce behaviour

- **WHEN** a plugin supplies formatted text containing markup that would execute
- **THEN** it is rendered without it

#### Scenario: Something that is entirely unsafe is dropped

- **WHEN** what a plugin contributed does not survive sanitisation
- **THEN** it is dropped rather than registered as empty

### Requirement: A contributed name cannot displace what the workbench ships

A plugin SHALL be able to contribute named symbols, and its contribution SHALL be removed with it. A
name already taken SHALL NOT be overwritten by a plugin — the first holder keeps it and the
developer is told. A distribution, unlike a plugin, SHALL be able to replace what the workbench
ships.

#### Scenario: A plugin cannot take a name that is already in use

- **WHEN** a plugin contributes a name another plugin or the workbench already holds
- **THEN** the existing one is kept and the developer is told

#### Scenario: A distribution can replace a shipped symbol

- **WHEN** a distribution supplies its own version of a symbol the workbench ships
- **THEN** the distribution's is used

#### Scenario: A distribution's replacement cannot then be taken by a plugin

- **WHEN** a plugin contributes a name the distribution replaced
- **THEN** the distribution's is kept

#### Scenario: Contributed symbols leave with their plugin

- **WHEN** a plugin is deactivated
- **THEN** exactly the names it contributed are gone

### Requirement: A plugin contributes settings by describing them, not by drawing them

A plugin SHALL be able to contribute a section of settings by describing its rows, and the workbench
SHALL draw it. A row SHALL be one of a fixed set of kinds — a choice, a switch, a line of text, a
range, an action, or a piece of the plugin's own content — so that a contributed setting looks like
every other one.

Sections SHALL be ordered as declared, and a section SHALL disappear with the plugin that
contributed it.

#### Scenario: A described section is drawn by the workbench

- **WHEN** a plugin contributes a section describing its rows
- **THEN** the workbench draws them, each as the kind it declared

#### Scenario: A section leaves with its plugin

- **WHEN** the plugin that contributed a section is deactivated
- **THEN** the section is gone

#### Scenario: Registering under an existing identity replaces in place

- **WHEN** a section is contributed under an identity already in use
- **THEN** it replaces the previous one rather than appearing twice

### Requirement: Whoever owns a setting stores it

Each row SHALL carry its own reading and writing, so that the workbench stores its own preferences
and a plugin stores its own. The workbench SHALL NOT become the keeper of a plugin's data.

Changes SHALL take effect as they are made, without a separate confirming step.

#### Scenario: A plugin's setting is stored by the plugin

- **WHEN** the user changes a setting a plugin contributed
- **THEN** the plugin persists it, by whatever means it chose

#### Scenario: A change applies immediately

- **WHEN** the user changes a setting
- **THEN** it takes effect without a further confirmation

### Requirement: A distribution may remove a section or a single row

A distribution SHALL be able to remove a whole section or an individual row by naming it, and the
removal SHALL be lasting, so that something registered afterwards under that identity stays removed.
A section left with no rows SHALL disappear rather than being drawn empty.

Because a settings identity can coincide with the identity of something else in the chrome, a
removal aimed at settings SHALL name that it means settings, and one aimed elsewhere SHALL NOT reach
them.

#### Scenario: Removing a row leaves the rest of its section

- **WHEN** a distribution removes one row
- **THEN** the other rows of that section remain

#### Scenario: A section emptied by removals is not drawn

- **WHEN** every row of a section is removed
- **THEN** the section itself is not drawn

#### Scenario: Removal outlasts a later registration

- **WHEN** a section is contributed after its identity was removed
- **THEN** it stays removed

#### Scenario: Removing a chrome item does not remove a settings row of the same name

- **WHEN** a distribution removes an item from the chrome whose identity matches a settings row
- **THEN** the settings row is untouched

### Requirement: A row that cannot work is not drawn

A row whose action nothing registers SHALL be dropped rather than drawn as a control that does
nothing, and a section left empty by that SHALL be dropped with it.

#### Scenario: A row pointing at nothing disappears

- **WHEN** a row names an action that nothing registers, or that a removal took away
- **THEN** the row is not drawn, and its section goes with it if nothing else remains

### Requirement: The settings surface is usable with nothing in it

The workbench SHALL open its settings surface even where nothing has been contributed, saying so
rather than presenting an empty frame, and SHALL show a section on opening rather than waiting to be
asked.

#### Scenario: An empty settings surface explains itself

- **WHEN** the settings surface is opened with no section contributed
- **THEN** it says that there is nothing to configure

#### Scenario: Opening lands somewhere

- **WHEN** the settings surface is opened
- **THEN** a section is shown without the user choosing one first

### Requirement: A settings row may be led by a symbol

A settings row SHALL be able to carry a symbol before its label, named the way every other symbol in
the workbench is named and resolved through the same registry, so that a product whose rows are led
by a symbol uses the workbench's row rather than a copy of it.

The symbol SHALL be decoration: what names the row for anyone not seeing it stays the label. A row
that names no symbol SHALL be drawn as it is without one, with no space held for it.

#### Scenario: A row that names a symbol shows it before the label

- **WHEN** a settings row names a symbol
- **THEN** it is drawn before the label, in the same size and colour the workbench gives a symbol
  beside text

#### Scenario: A row without one is unchanged

- **WHEN** a settings row names no symbol
- **THEN** the row is drawn as it was, with no gap where a symbol would be

#### Scenario: The symbol is not what the row is called

- **WHEN** a settings row carrying a symbol is read out
- **THEN** the label is what names it, and the symbol adds nothing to that

### Requirement: A settings row takes a line of its own

A settings row SHALL occupy a line of its own, so that whatever holds a stack of rows can separate,
frame or space them by their edges. The row SHALL draw no separator itself; separating rows stays the
container's decision.

#### Scenario: A container's separators between rows are drawn

- **WHEN** a container draws a line between each of its settings rows
- **THEN** the line is visible between every pair of rows

#### Scenario: The workbench's own settings surface separates its rows

- **WHEN** the settings surface shows a section with more than one row
- **THEN** a line is drawn between each pair of rows
