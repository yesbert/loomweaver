## Context

See proposal.md — Why. What shapes this is that two of the three edits are safe by construction and
the third is not.

Removing an explicit `OnPush` cannot change behaviour: the value removed is the value the framework
applies in its absence. Replacing a constructor injection with `inject()` cannot either, as long as
the field keeps its initialisation position.

`@Injectable({ providedIn: 'root' })` → `@Service` is different. `@Service` provides
application-wide by default, so it is equivalent **only** for classes that were root-provided.
Applying it to a class that is provided by hand would silently give it a second, root-scoped instance
alongside the intended one. That is the single hazard in this change, and it is why the two
non-root injectables are enumerated rather than pattern-matched.

## Goals / Non-Goals

**Goals:**

- The code stops stating what the framework already guarantees.
- The two rules `CLAUDE.md` already calls binding — `@Service` and `inject()` — are actually
  followed.
- The scaffolds teach the current idiom, since what they emit becomes somebody else's starting point.

**Non-Goals:**

- Any other Angular modernisation. There is nothing else left: no `NgModule`, no `*ngIf`, no
  decorator inputs, no `@HostBinding`, no `ngClass`. This is the tail, not a sweep.
- Adopting Signal Forms, `resource()` or `@defer` anywhere they are not already used. Those are
  capabilities, not leftovers, and each would be its own change with its own reason.
- Touching `@Injectable()` where the absence of `providedIn` is deliberate.

## Decisions

**Enumerate the non-root injectables instead of matching a pattern.** There are two. A regular
expression for `@Injectable({ providedIn: 'root' })` would skip them correctly today, but the
conversion is being done across 70 files and the cost of listing two names is nothing against the
cost of one wrong instance scope. The list goes in the task, so a reviewer can check it rather than
trust it.

**Delete the `ChangeDetectionStrategy` import along with the last use in a file, not before.** Some
components import the symbol for other reasons; removing the import blindly turns a mechanical edit
into a compile error found late. Drive it off whether the identifier still occurs in the file.

**Verify against the packed declarations, expecting them to change.** A decorator swap alters the
Angular compiler's emitted static fields, so unlike the previous change the packed `.d.ts` may
legitimately differ in more than private members. The check is therefore not "nothing differs" but
"no exported name is added, removed or retyped" — `api-docs-check` and `package-exports-check` are
the instruments, and any diff beyond compiler-generated members gets read line by line.

**Do the demo in the same change.** Its 8 explicit `OnPush` are the same leftover, it now has its own
lint gate, and splitting one mechanical edit across two changes to respect a directory boundary would
be ceremony.

## Risks / Trade-offs

**A converted class was not actually root-provided** → the two exceptions are enumerated in the
tasks, and the conversion is done by matching the full `@Injectable({ providedIn: 'root' })` form
rather than `@Injectable`. Cross-check afterwards: the count of `@Service` plus the count of
remaining `@Injectable` must equal the 72 that exist today.

**`@Service` behaves differently from `@Injectable({providedIn:'root'})` in some corner** → the
framework documents it as marking a class as a service available application-wide by default, which
is the same guarantee. If the suite disagrees anywhere, the suite is the evidence and the conversion
stops there with the reason recorded.

**A component relied on being checked eagerly** → impossible by construction here, since every one of
these components already declares `OnPush` and keeps it, just implicitly. A component wanting the
eager strategy would have to say `ChangeDetectionStrategy.Eager`, and none does.

**The e2e suite catches what unit tests miss** → change detection is exactly the class of thing that
looks fine in a TestBed and wrong in a browser. This lands with the nightly run as its final
confirmation rather than claiming completeness before it.
