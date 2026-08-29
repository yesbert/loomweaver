## ADDED Requirements

### Requirement: Navigating reaches the content where it already is

Where the user has content open somewhere in the workbench, navigating to that content SHALL reach
the copy that is already open rather than opening a second one beside whatever they were looking at.
This SHALL hold however the navigation was started — by the application's own chrome, by a link or a
programmatic navigation inside content, or by browser history — because a user cannot tell those
apart and would meet two different behaviours for one gesture.

Reaching an existing copy SHALL move only which part of the arrangement carries the address; it SHALL
NOT move, rebuild or reorder anything the user arranged.

The guarantee is about the content, not its parameters: content open at a different parameter value
is different content, and navigating to it opens it rather than reusing what is there.

#### Scenario: An ordinary link reaches the copy in another pane

- **WHEN** content is open in one pane and a link inside another navigates to it
- **THEN** the pane already holding it takes the address, and no second copy is opened

#### Scenario: The chrome and a link behave alike

- **WHEN** the same address is reached once from the workbench's own chrome and once from a link
  inside content
- **THEN** the outcome is the same in both cases

#### Scenario: Reaching an open copy leaves the arrangement alone

- **WHEN** navigation reaches content another part of the arrangement already holds
- **THEN** nothing is moved, rebuilt or reordered, and the panes keep what they were showing

#### Scenario: Nothing open yet means an ordinary open

- **WHEN** navigation names content that is open nowhere
- **THEN** it opens where the address is currently carried, as it does today

#### Scenario: A different parameter value is not an existing copy

- **WHEN** content is open at one parameter value and navigation names another
- **THEN** the second is opened rather than the first being reused
