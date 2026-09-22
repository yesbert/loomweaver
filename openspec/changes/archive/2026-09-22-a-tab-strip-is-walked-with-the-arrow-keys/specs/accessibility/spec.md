## MODIFIED Requirements

### Requirement: A tab strip stays a valid tab list

Because a tab is announced as a tab, it cannot contain another focusable control. Affordances drawn
inside a tab — closing it, unpinning it — SHALL therefore not be focusable, and their function
SHALL be reachable from the keyboard by another route.

A tab strip SHALL also behave as the tab list it is announced as. It SHALL be a single stop in the
focus order: moving focus into it SHALL land on its selected tab, and moving focus on SHALL leave
it. Within it, the left and right arrow keys SHALL move the
focus to the previous and next tab, wrapping at either end, and Home and End SHALL move it to the
first and the last tab. Moving the focus SHALL NOT choose a tab; Enter or Space SHALL choose the
focused one. This SHALL hold for every tab strip the workbench draws.

The limits of that: a key pressed with a modifier keeps the meaning the workbench gives it elsewhere,
such as reordering or moving, and a distribution cannot make the focus choose the tab.

#### Scenario: The close affordance is not a second focus stop

- **WHEN** a user walks a populated tab strip with the arrow keys
- **THEN** focus lands on each tab and not on the affordances drawn inside them

#### Scenario: A strip is one stop in the focus order

- **WHEN** a strip holds several tabs and the user moves focus into it and then on
- **THEN** focus lands on the selected tab, and the next move leaves the strip

#### Scenario: The arrow keys walk the strip without choosing

- **WHEN** a tab in a strip has focus and the user presses the right arrow key
- **THEN** the next tab has focus, and the tab that was selected is still selected
- **AND** on the last tab the right arrow key moves the focus to the first

#### Scenario: Home and End jump to the ends

- **WHEN** a tab in a strip has focus and the user presses End, then Home
- **THEN** the focus moves to the last tab, then to the first

#### Scenario: Enter chooses the focused tab

- **WHEN** the user has moved the focus to a tab that is not selected and presses Enter
- **THEN** that tab is chosen, as a click on it would choose it

#### Scenario: A container's inner strip behaves the same

- **WHEN** a container is open and a tab of its inner strip has focus
- **THEN** the arrow keys, Home and End move the focus within that strip only
