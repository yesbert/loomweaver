## Context

The refusal of a replaced contribution already lives where a frame plugin's registrations are
admitted: a plugin running below the application's own code is checked against what other owners
hold, and a refusal is a developer warning naming both. Ownership of an address for unsaved work
already follows the declaring route, the most specific one, so a plugin at `docs` does not own
`docs/special/x` when another plugin declares `docs/special`.

A frame plugin registers everything over its connection. When the connection never comes up, the
workbench has nothing registered for it, and a remembered tab or a link at its address looks
exactly like an address nobody answers.

## Decisions

- **One admission check.** The address below another owner's is refused by the same check that
  refuses a replaced id or address, with the same warning shape and the same exemption for the
  application's own plugins and the distribution. A second mechanism was rejected.
- **The application's own code wins whichever comes first.** A frame plugin that registered below an
  address before the distribution or an in-page plugin registered that address is withdrawn when
  they do, with the same warning saying it was withdrawn. Otherwise the outcome would depend on load
  order, and a frame plugin connecting early could keep what the product answers. Between two frame
  plugins the first keeps the address, since neither outranks the other.
- **Under means a longer address that the held one would match.** Segments are compared one by one,
  a parameter on either side matching any segment. The home address is not counted, because every
  address lies under it. Registering a shorter address above another owner's is not covered: the
  decision named addresses under another owner's, and the most specific declaration still answers
  the deeper address.
- **Reported as the other refusals are.** No per-plugin status of refused registrations exists; a
  refused replacement is a developer warning. The refused address below another owner's is reported
  the same way. A status surface for refusals would be a new feature beyond this decision.
- **The workbench remembers what each frame plugin answered.** To say which plugin a view belongs to
  when that plugin never connected, the workbench keeps, per frame plugin, the addresses and view
  ids it registered while connected, in working state. It is reset when the plugin connects and
  dropped when the plugin is removed. At most a hundred are kept per plugin, the oldest dropped first,
  and at the first activation after the user's plugin choices are read, the entries of plugins that
  are neither composed, deployed nor installed are dropped. If the installed list arrives later than
  those choices, a plugin's entry may be dropped once; its failure then reads as not existing until it
  answers again. A plugin that never answered before is not named; its address
  still reads as not existing. Naming any failed plugin at any unknown address was rejected because
  it would blame a plugin for a link it never answered.
- **Trying again starts that one plugin again.** It clears the failure and lets activation start the
  frame anew; nothing else reloads. The trusted runtime's existing message for an in-page plugin
  that failed to activate is unchanged, since an in-page plugin cannot be restarted alone.
- **The capture limit is stated, not closed.** The picture is drawn inside the plugin's document, so
  its own script can observe the nodes the renderer adds and removes. Hiding that would need drawing
  outside the frame, which the isolated level forbids. The requirement says what a plugin may see,
  and the end-to-end test pins that no message reaches it and that its view is pictured unchanged.

## Consequences

A frame plugin that registered content below the product's address loses it and is told so in the
console. The working state gains one key listing the addresses each frame plugin answered; it holds
paths and view ids only.
