> **Status:** approved.

## Why

A plugin outside the application's own code may not replace an address another owner holds, but it
can still register one below it. A plugin installed from a catalogue that registers `orders/:id`
under the product's `orders` takes every order the product would have shown, which is the same
takeover by a longer address.

A view whose frame plugin never connected (it failed to load, the network was down, a policy
blocked it, or it did not answer in time) says that the view does not exist in this application.
That is false and sends the user looking for a wrong link instead of a plugin that did not start.

The capture capability promises that a plugin gets no moment at which it could act differently
because it is pictured. A plugin's own script can notice that its document changes while it is
pictured, so the sentence promises more than the workbench keeps.

## What Changes

- A plugin that does not run as the application's own code is refused an address that lies under
  an address another owner holds. The registration is reported to the developer, naming both
  addresses and both owners. The first owner keeps the address. **BREAKING** for a frame plugin that
  registered content below the product's or another plugin's address.
- A view whose frame plugin could not be loaded names the plugin, says it could not be loaded and
  offers to try again, which loads that plugin's frame anew. "Does not exist" remains only for a
  view nobody registered. The workbench remembers which addresses each frame plugin answered so
  that it can tell the two apart in a later session.
- The capture requirement states its limit: a plugin is sent no message about a picture, but its
  own script may observe its document changing while it is pictured, and it learns nothing beyond
  that.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-runtime`: replacing a contribution covers an address below another owner's.
- `plugin-sandbox`: a view whose frame plugin could not be loaded says so and offers to try again.
- `workbench-capture`: a plugin is sent no message about a picture, and its own script may see its
  document change.
