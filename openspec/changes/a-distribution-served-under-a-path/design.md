## Context

See proposal.md, Why. The two places that ignore the base today:

- **Translations.** The loader requests `/i18n/<lang>.json`, `/i18n/<name>/<lang>.json` and, for a
  language the workbench does not ship, `/i18n/en.json` as its fallback. The overlay directory
  defaults to `/i18n/overrides`. All four are origin-absolute.
- **Pop-outs.** `popoutUrlFor` builds `/popout/…`, and the pop-out service passes it to
  `window.open` unchanged. The new window decides whether it is a pop-out from
  `document.location.pathname`, which includes the base, so under `/x/` it would not recognise
  `/x/popout/…` even if it were opened there. Everything after that (the route table's `popout/**`
  entry, the boot address the guards read, the pop-out view's target) already works on the address
  below the base, because it comes from the router or from `Location`.

Angular already knows the base: the location strategy reads it from the page's `<base href>` or from
`APP_BASE_HREF`, and every router address is relative to it.

## Goals / Non-Goals

**Goals:**
- Every request and window the workbench makes on the distribution's behalf resolves under the base.
- A distribution at the root makes byte-identical requests.
- A browser case that serves the testbed under a path, since only real serving shows the defect.

**Non-Goals:**
- Addresses a plugin or a distribution builds itself: an isolated plugin's source, a product's
  own API calls, icons given as URLs. They are the author's to resolve, and the requirement says so.
- A second base the product declares for the workbench. The application declares its base once;
  the workbench reads that.

## Decisions

**Resolve against the base the application declares, read in one place.** A small shell service,
`ServedBase`, reads the base the way Angular's path location strategy does (`APP_BASE_HREF` first,
then the page's `<base href>`, and `/` when neither says anything, an empty value included) and
joins the workbench's path to it. The loader and the pop-out service both use it, so the two cannot
disagree, and a root base yields exactly today's addresses. The location strategy itself is not
asked: without a base element it falls back to the page's origin, which would turn every request
into a full URL and change what a distribution at the root requests.

*Alternatives considered:*
- **Relative request URLs** (`i18n/de.json`). The browser resolves them against the document's base
  element; without one, against the current page, so a deep link at `/gated/one/design` would ask for
  `/gated/one/i18n/de.json`. And `APP_BASE_HREF` would be ignored. Rejected.
- **`document.baseURI`.** Ignores `APP_BASE_HREF` for the same reason. Rejected.
- **A new option for the base.** A second statement of a fact the application already declares, and
  one more thing to keep in step. Rejected.
- **Leave it to an HTTP interceptor in the product,** as NextPA does now. It only reaches requests
  that go through `HttpClient`, never reaches the pop-out, and every product under a path would
  write the same one. Rejected.

**The default overlay directory becomes relative; a named one keeps its meaning.** The default is
`i18n/overrides` below the base. A directory the product names is resolved the same way when it is
relative, and used as named when it starts at the origin's root or is a full URL. The refusal of a
directory that reduces to the application's root stays.

**The pop-out's own address stays base-free; only the window receives the base.** `popoutUrlFor`
keeps returning the address below the base, which is what the router, the guards and the tests
work with. The pop-out service puts it under the base for `window.open`. The pop-out window strips
the base from the raw pathname before it asks whether it is a pop-out, so `/x/popout/…` counts and
`/x/popouts/…` does not. It keeps reading the document's location rather than `Location.path()`,
because it answers before anything renders and the tests give it a document of their own.

**The browser case serves the testbed under `/x/`.** A build configuration with base `/x/` and a
serve configuration with the serve path `/x/` on a port of its own; a Playwright project with that
server and base URL runs one spec, and the default project leaves that spec out. The spec checks
that the strings arrive from `/x/i18n/…`, that nothing is requested from `/i18n/…`, and that "Open
in new window" opens `/x/popout/…`, which starts as a pop-out.

## Risks / Trade-offs

- [A product under a path served its strings at the root on purpose] → Its requests move under the
  base. Angular's asset configuration already places them beside `index.html`, where the base
  points, and the guides say so. NextPA's interceptor stops matching once the requests carry the
  base, so it is harmless until NextPA removes it.
- [The extra Playwright project starts a second dev server in the nightly run] → One spec, one
  server; the nightly budget has room, and without it the guarantee would rest on unit tests that
  never serve anything, which is the gap F-032 fell through.
