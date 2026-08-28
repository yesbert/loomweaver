## 1. Pin the defect first

- [x] 1.1 A failing test: a component surface that asks to be kept, parked by a workspace switch,
  comes back with what the user had done in it intact.
- [x] 1.2 A failing test: an isolated surface that asks to be kept, parked by a workspace switch,
  comes back on the channel it had — neither reloaded nor re-handshaken.

## 2. Carry what a pane was keeping across the switch

- [x] 2.1 What each pane of the outgoing workspace was keeping is put aside under that workspace
  rather than discarded with its arrangement.
- [x] 2.2 Choosing a workspace again takes up what it had, so the pane finds its own holding and not
  another workspace's.
- [x] 2.3 A surface that did not ask to be kept is still destroyed by the switch.

## 3. Leave the frame where it stands

- [x] 3.1 An isolated surface parked by a switch stops being shown without leaving the document, the
  way it already does when it is hidden within a workspace.
- [x] 3.2 A parked frame is neither drawn nor reachable while another workspace is on screen.

## 4. Say what is now true

- [x] 4.1 Fold the delta into `surface-retention` and check the guide's account of retention against
  it, so nothing still says a switch ends a kept surface.

## 5. Verify

- [x] 5.1 The two tests from section 1 pass, and the existing retention suite is unchanged.
- [x] 5.2 The demo's payment matching keeps its confirmations across a rail switch, which is the
  case that found this — and task 1.3 of `demo-payments-sandbox` can then be ticked.
