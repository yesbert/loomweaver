## MODIFIED Requirements

### Requirement: A pop-out shows one piece of work and nothing else

A pop-out window SHALL show exactly one piece of work, without the launcher, the sidebars or the tab
strips. The actions that piece of work declares belong to it, so they SHALL be drawn with it, in a
bar above it that is absent where there is none to draw. Everything that is not the workbench's arrangement — appearance, text size, dialogs, notices
and the session — SHALL work as in the main window, because it is the same application.

#### Scenario: The window is bare

- **WHEN** a piece of work is opened in a window of its own
- **THEN** it fills the window, with no launcher, sidebar or tab strip

#### Scenario: The window carries the product's name

- **WHEN** a pop-out window opens
- **THEN** it is titled with the product's identity

#### Scenario: The work's own actions come with it

- **WHEN** a piece of work that declares actions is opened in a window of its own
- **THEN** the window shows those actions above it, and still no launcher, sidebar or tab strip
