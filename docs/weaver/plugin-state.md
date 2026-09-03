# Your plugin's own store

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `persistence-ports`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page gives your plugin one store that all of its surfaces share: `ctx.state`, namespaced to your
plugin id and visible in every dock, every instance and every browser window. You need it when several
of your surfaces have to agree on something. One example is a wizard whose step form is popped out into
a second window while the main window has to see what the user types. `VIEW_STATE` cannot carry that,
because it belongs to *one mounted view instance*.

```ts
interface Wizard { readonly customer: string; }

const step = ctx.state.watch<Wizard>('wizard/step-1');

if (step.loaded()) {                       // check before applying your default
  input.value = step.value()?.customer ?? '';
}
input.addEventListener('input', () => step.set({ customer: input.value }));
// when the surface goes away
step.dispose();
```

Every surface of your plugin sees the same store — any dock, any number of instances, every browser
window — so it is both your persistence and the only channel between your own surfaces. The host
prefixes every key with your plugin id and you cannot leave that namespace, which is why there is no
capability to grant: there is nothing foreign to reach.

## Four rules

- **Check `loaded()` before you apply a default.** With a local store it is true at once. With a
  network-backed one there is a real window in which the store has not answered, and a default applied
  in that window is overwritten the moment the value lands — after the user has started typing.
- **`set` replaces the whole value; nothing is merged.** Use **one key per unit of editing**: a wizard
  step, not the whole form. Where your surface can exist more than once, key by instance too
  (a sandboxed surface receives its `instanceId` with its pushed state). Two windows writing two keys
  converge; two windows replacing one key means last write wins, which costs the user's typing.
- **It holds working state, not settings.** Settings have their own path precisely because the user
  can *see* and change them in the settings dialog; a free-form settings store would be a back door
  around that. Uninstalling your plugin deletes this store — a settings section survives, an abandoned
  draft is litter.
- **Values are JSON and writes are debounced.** Siblings in the same window see a change at once;
  other windows see it once the debounced write lands. There is a size cap per value and a count cap
  per plugin, with a development warning at half of each, so no plugin can flood the user's storage.

## The same store in a sandboxed plugin

A **sandboxed** plugin gets the same store on both of its channels. Its logic document calls
`stateWatch` / `stateSet` / `stateClear` / `stateUnwatch` on the `ctx` it already has, and the host
pushes every change back as `stateChanged(key, value, loaded)`. A **surface** has the same four
methods on its own channel — which matters, because a surface holds no `ctx` at all and this is the
only way two surfaces of one sandboxed plugin can agree on anything. The kit reassembles the pushes
into the handle shape above, so the code reads the same as on the trusted rung:

```js
// view.js
const shared = LwFrame.state.watch('wizard/step-1');
shared.onChange(render);                       // re-render when the host pushes

const connection = Penpal.connect({
  messenger,
  methods: {
    render(state) { LwFrame.applySurfaceState(state); render(); },
    stateChanged: (key, value, loaded) => LwFrame.state.apply(key, value, loaded),
  },
});
connection.promise.then((host) => LwFrame.connectState(host));

input.addEventListener('input', () => shared.set({ customer: input.value }));
```

## Where next

- [View state that survives](view-state.md): `VIEW_STATE`, the store for one mounted view instance.
- [Settings sections](settings.md): the path for values the user should see and change.
- [Sandboxed surfaces](sandboxed-surfaces.md#the-frame-ui-kit): the kit whose `LwFrame.state` reassembles the pushes.
