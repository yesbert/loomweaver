## Context

See proposal.md for why this is being built now. What shapes the approach is what the vocabulary
already is, and it is less framework-shaped than one might assume:

- The elements are plain custom elements building light DOM. None of them opens a shadow root, and
  they take the workbench's appearance because the workbench's stylesheet reaches them. Anything
  written here about slots and styling follows from that, not from the shadow DOM the plugin
  boundary uses elsewhere.
- For anything list-shaped the vocabulary already has an answer: `lw-select` takes `lw-option`
  children, mirrors attribute and property both ways, and watches its own children for changes. It
  is the nearest precedent and the navigation tree is the same problem one level deeper.
- The demo has run a working tree for a while now, in `demo/src/navigation/`, with areas that fold,
  entries with icons, marking by address and a per-area default for whether it starts open. That is
  the shape practice produced, and the element should be able to draw exactly it. Anything the demo
  still has to work around afterwards is a defect here.
- The segment rule this control needs is already a guarantee in `routing`, answered for plugins by
  the workbench. An element has no plugin context, so it cannot ask; it has to carry the same rule.

## Goals / Non-Goals

**Goals:**

- One control that the workbench, the demo and a product outside this repository can all draw the
  same sidebar with, without any of them restating the segment rule.
- A declaration a reader can see the sidebar in, so that what is drawn is obvious from the markup.
- Room for a product to put its own mark on an entry without the element growing a vocabulary of
  badges, counters and dots.

**Non-Goals:**

- Storing anything. The tree keeps folding for the session and no longer, and it never reaches a
  port to write it down.
- Navigation. The tree reports a choice; routing belongs to whoever declared the tree.
- Nesting past two levels. The demo established that an entry needing a third level is pulled up to
  the rail instead, and this control is built for what that produced.
- Drag, reorder, rename or any editing of the tree by the user.

## Decisions

### The declaration is markup, not a data property

`<lw-nav-tree>` takes `<lw-nav-group>` and `<lw-nav-item>` children, and a group takes items of its
own. An item outside a group sits directly in the tree, which is how "a destination may stand on its
own" falls out of the shape rather than being a flag.

The alternative was a `groups` property holding an array of objects. It was rejected for three
reasons. It disagrees with `lw-select`, which is the same problem already solved here. It makes
consumer markup opaque, since the sidebar is then invisible in the template. And it turns free
content into named slots keyed by identity, which is the awkward part of the next decision.

Consequence to accept: the element watches its children rather than an input, which is more code
than reading a property, and `lw-select` shows what that costs.

### A mark on an entry is content the consumer writes

Because these elements build light DOM, whatever a consumer puts inside `<lw-nav-item>` beyond its
label is simply there, and the element leaves room for it at the end of the row. A count, a dot, an
amount, a spinner: the element neither knows nor cares.

The alternative was an attribute the element draws, such as `badge="7"`. It was rejected because
every product would then want the next variant, and the element would grow a small design system for
things it cannot know the meaning of. This is also what the owner asked for originally, and the
markup decision above is what makes it free rather than a named-slot mechanism.

### The tree is told the address, and applies the rule itself

`current` is an attribute on the tree, and each item carries the address it stands for. The element
decides what is marked, applying the same segment rule `routing` states.

The alternative was a `current` flag per item, leaving the comparison to the consumer. It was
rejected because that is exactly the mistake this change exists to stop: a consumer writing
`startsWith` marks `sales/quotes` while the user is at `sales/quotesomething`. The rule is stated
once in the contract and implemented twice inside the platform, in the workbench's answer to a
plugin and in this element, and both are tested against the same cases.

Consequence to accept: the rule now lives in two places in the platform's source. That is worth it
against the alternative of living in every consumer's source, and a shared implementation of the
comparison keeps the two from drifting.

### Folding is state of the control, keyed by the group's identity

The element holds which groups are shut. A group carries the identity the consumer gives it and a
declaration of whether it starts shut; the element seeds itself from that and then remembers what
the user did, for as long as the element's own state lives.

The tricky part is what "for the session" means for something drawn and undrawn as the user moves
around: state on the instance is lost the moment the consumer takes the tree off screen, which is
precisely the case the guarantee names. The state therefore lives beside the element rather than on
the instance, keyed by group identity, and an element drawn again finds what the previous one left.

The alternative was folding as a two-way attribute the consumer owns and persists. It was rejected
for this change because it makes every consumer implement the memory before the sidebar behaves
decently, and the owner named persistence as a separate change. Nothing here forecloses it: an
attribute reporting the fold state can be added later without the guarantees above changing.

### It ships inside the shell, beside the others

Not a package of its own. It is the same kind of thing as the button and the select, it is styled by
the same stylesheet, and a package per control would multiply the release surface for no consumer
benefit.

Consequence to accept, and the reason this is written down: the guarantees the vocabulary already
carries now apply to this control too. It has to work driven by attribute and by property, cope with
a property set before it was upgraded, re-render when its configuration changes, and work in a
surface running isolated from the workbench. That last one is the largest piece of unglamorous work
in the change, and it is not optional.

The owner asked that the package not be inflated. The added weight is measured against the current
build before this is published and named in the pull request, so the trade is visible rather than
assumed.

### Naming

`lw-nav-tree`, `lw-nav-group`, `lw-nav-item` for the tags. The event is `lw-nav-select`, carrying
the chosen address, rather than following `lw-select-change`: "change" describes a value that
changed, and nothing here changes until the consumer acts on the report. Recorded as a decision
because a tag and an event name are contract from the day they publish and cannot be tidied later.

## Risks / Trade-offs

- The demo cannot express something it can today, and the defect is only found after the migration →
  the demo is migrated in this change rather than after it, and the migration is a task, not a
  follow-up. Group 2 of `demo-erp-navigation` waits for it deliberately.
- The segment rule drifts between the workbench's answer and the element's → both use one shared
  comparison, and the element's tests state the same cases the plugin-facing rule is tested against.
- The element grows toward a general tree control, with nesting, editing and drag → the non-goals
  above are the boundary, and the two-level limit is a finding from practice rather than a
  simplification.
- The weight lands badly for consumers who never draw a sidebar → measured before publishing; if it
  is out of proportion, the decision to ship it inside the shell is the one to revisit, and that is a
  conversation with the owner rather than a silent split into a new package.
- Light DOM means a consumer's stylesheet can reach inside the control and a product could quietly
  depend on its internals → the classes it draws with are part of what the workbench's stylesheet
  contract already covers, and are named as such rather than treated as private.
