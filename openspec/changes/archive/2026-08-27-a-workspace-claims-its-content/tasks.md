## 1. The declaration

- [x] 1.1 Let a workspace definition declare the content addresses it claims, in the same route-path
      vocabulary its declared tabs already use, including a family of addresses that differ only by
      which document they name.
- [x] 1.2 Resolve an address against the claims the way the workbench already resolves a specific
      route against a general one, so a narrower claim wins without a rule of its own.
- [x] 1.3 Audit the claims where the other definition problems are already collected: two declared
      claims neither narrower than the other drop both and name the competing workspaces, and a claim
      no surface serves is named as well.

## 2. A saved workspace is a variant

- [x] 2.1 Record, when the user saves an arrangement, which workspace the product declared it came
      from, taking the nearest declared one so that saving from a variant stays one step deep.
- [x] 2.2 Read a variant's claims through its origin rather than copying them, so a claim the product
      adds later reaches every variant of that workspace.
- [x] 2.3 Treat a missing origin as ordinary: saved from a workspace the product did not declare, or
      left behind when the product stops declaring it. The variant then claims nothing and still
      works.
- [x] 2.4 Show the origin wherever workspaces are listed for switching or managing, because it is the
      explanation for why one variant keeps a kind of content and another does not.

## 3. Honouring it

- [x] 3.1 Resolve the claim in the one place every address change passes through, so a link, a
      restart, a command, a programmatic navigation and a plugin's tab are covered by construction
      rather than one at a time.
- [x] 3.2 Switch before the content is shown, so the document arrives inside the workspace that
      claimed it rather than in the one being left.
- [x] 3.3 Leave the active workspace alone when it claims the address itself, and when nothing
      claims it.
- [x] 3.4 Let a claimed address decide the workspace on a first visit, so that an address winning
      over the declared start now decides where as well as what.

## 4. Proving it

- [x] 4.1 Test each way in separately, because they are separate paths in the product even if they
      are one path in the workbench: a link followed into the application, a restart, a programmatic
      navigation and a tab a plugin opened.
- [x] 4.2 Test that a narrower claim wins over a wider one, both ways round.
- [x] 4.3 Test that two equal claims are reported, that both are dropped, and that the application
      still runs with the address behaving as unclaimed.
- [x] 4.4 Test that a product declaring no claims behaves exactly as before, which is what makes this
      safe to ship.
- [x] 4.5 Test the first-visit interaction: a claimed address beats the declared starting workspace,
      and the bare address still does not.
- [x] 4.6 Test the variant both ways round: it keeps content its origin claims while it is active,
      and an incoming address still leads to the declared workspace rather than to it.

## 5. The demo, which is where the report came from

- [x] 5.1 Let the demo's Quotes workspace claim the quote document address, and check that opening a
      quote from Overview now lands there with the list in its panel, by the agent and by a plain
      link alike.
- [x] 5.2 Extend the demo's own suite to hold that, since it is the case a visitor will try.

## 6. Documentation

- [x] 6.1 Say in the distribution guide what a claim is and when to write one, next to the rest of
      the workspace declaration.
- [x] 6.2 Say plainly that a claim moves the user whenever the address is reached, because that is
      the part a reader will otherwise discover by surprise.
- [x] 6.3 Say what a variant is and what it inherits, since a user who saves a workspace is choosing
      more than a name.

## 7. Verification

- [x] 7.1 Run the workspace gate for the projects this touches, and the repository guards.
- [x] 7.2 Run the demo's lint, test, build and its own suite against the change.
- [x] 7.3 Run `openspec validate --all --strict`.
