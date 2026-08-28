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

#### Scenario: A plugin uses a workbench control by tag

- **WHEN** a plugin's own content uses one of the workbench's elements by tag
- **THEN** it renders and behaves as it does in the workbench's own chrome

#### Scenario: An isolated surface uses them too

- **WHEN** a surface running isolated from the workbench uses the same elements
- **THEN** they render and behave the same, and take the workbench's current appearance

#### Scenario: A native control is styled rather than wrapped

- **WHEN** a plugin needs a control the browser already provides
- **THEN** the workbench offers a style class for it rather than an element that reimplements it

### Requirement: An element behaves correctly however it is driven

An element SHALL accept its configuration both as an attribute and as a property, SHALL reflect
changes made after it is on screen, and SHALL cope with a property set before it was upgraded.

#### Scenario: A value set before the element was ready is not lost

- **WHEN** a property is set on an element before its definition has loaded
- **THEN** the value takes effect once it does

#### Scenario: Changing a value re-renders

- **WHEN** an element's configuration changes while it is on screen
- **THEN** it re-renders

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
