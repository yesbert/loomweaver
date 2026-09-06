## 1. The second rail, and what moves onto it

- [x] 1.1 Declare a rail region on the right of the demo's layout, between the content area and the
      assistant panel.
- [x] 1.2 Move workspaces to the bottom of the right rail. Settings stays where it is, at the bottom
      of the left rail.
- [x] 1.3 Give the agent plugin a command that reveals its chat surface, and put an assistant entry
      at the top of the right rail that runs it. The command is in the palette like every other.
- [x] 1.4 Look at it once. Two rails, a narrower content area, the assistant open and closed.

## 2. The account, as one entry with a menu

- [x] 2.1 Give the demo a session plugin that registers the account rail item: drawn from the
      signed-in person's initials, opening its menu on an ordinary click, headed by that person's
      name.
- [x] 2.2 Register the menu's entries and the commands behind them: switch account and sign out
      while signed in, sign in while signed out. The two rail items they replace are removed.
- [x] 2.3 Re-register the entry as the session changes, so the initials and the heading follow the
      account rather than being fixed at start-up.
- [x] 2.4 Draw the first account from a photograph the demo serves itself, and leave the second at
      its initials, so switching accounts shows both rungs of the fallback.
- [x] 2.5 Every label of the menu in both languages.
- [x] 2.6 Unit tests: the entry names the signed-in person and keeps its place when the account
      changes; the menu offers signing in while signed out and switching while signed in; the
      account without a picture falls back to its initials.

## 3. What the change touches elsewhere

- [x] 3.1 Read the end-to-end suite for what it assumes about the rail, and fix what the second rail
      moved.
- [x] 3.2 Accessibility check over the account entry: the menu opens from the keyboard, its heading
      is announced once, and the entry is reachable in both rails.
- [x] 3.3 Look at the whole thing at a small window, where two rails, a tree and the assistant
      compete for width.
