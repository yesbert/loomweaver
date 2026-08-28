## 1. Pin the defect first

- [x] 1.1 A failing test: with a trusted, in-process plugin composed, what the permissions surface
  says about it does not claim it is held back from the application, its storage or the session.
- [x] 1.2 A test that the isolated line is still shown for a plugin composed at the isolated level,
  so the fix cannot be "say nothing to everyone".

## 2. Make the rung answerable

- [x] 2.1 The question the surface asks about a plugin can answer "trusted" for one registered
  in-process, instead of falling back to the frame default.
- [x] 2.2 The isolated default keeps applying where it belongs — a frame plugin that names no level.

## 3. Say it in both languages

- [x] 3.1 A trusted rung line in English and German: the plugin runs inside the application, and what
  holds it back is the grant it was given.
- [x] 3.2 A rung with no line of its own leaves the note out rather than borrowing another's.

## 4. Verify

- [x] 4.1 The tests from section 1 pass, and the permissions suite is otherwise unchanged.
- [x] 4.2 Read the surface with all three kinds of plugin composed and check each sentence against
  the plugin it stands under.
