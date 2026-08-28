## Context

See `proposal.md` — Why. What the demo already gives us, and what it does not:

- **It has the pieces the script needs.** A quotes weaver with a docked list and a routable document
  at `quotes/:id`; a looks weaver with three visibly different themes; an insights dashboard; a
  session control that can sign a visitor in. The document's margin child already declares
  `access: { anyRole: ['accounting'] }`, so the refusal beat uses a gate that has been there all
  along rather than one invented for the demonstration.
- **It has no commands.** Not one. Everything the demo does today is reached by clicking a surface.
- **It builds from the registry, not from source.** That separation is the point of the directory,
  and it is what makes the release a precondition rather than a preference.
- **It is deployed as static files.** No server, no key, no model. Anything the demo does, it does in
  the visitor's browser.

## Goals / Non-Goals

**Goals:**

- Make the claim checkable on screen: what the agent may reach, and what happens when it may not.
- Use the published packages exactly as a customer would, so what a visitor sees is what they get.
- Leave the demo better even for a visitor who never opens the chat.

**Non-Goals:**

- No language model, no API key, no proxy, no network call of any kind.
- No pretence of understanding. Nothing parses free text.
- No general chat surface for reuse. This is demonstration code, and a weaver that wants a real chat
  writes its own against `@loom/ag-ui`.
- Nothing under `platform/`. If the demo cannot express something, that is a finding about the
  platform and its own change, not a patch from here.

## Decisions

### The brain is scripted, and the screen says so

A real model would need a server, a key and money, and the demo is static by design. A scripted agent
needs none of them.

What matters is where the seam of the pretence sits. It sits at the **choosing** and nowhere else:
the agent emits real protocol events, so the tool list is read from the live registry, the call goes
through the workbench's own seam, the arguments are checked against what the command declared, and
the answer carries a real outcome. Everything a visitor can see working is working.

The panel says this in plain words rather than in a footnote. A demonstration that lets someone
believe there is a model behind it has lied about the only thing they will remember.

### Suggested prompts, not a text box, and not an autoplay

Three shapes were possible.

**Chosen: a few suggested prompts the visitor clicks.** It reads as a chat, the visitor sets the pace
and chooses the order, and nothing has to understand anything. A prompt maps to one beat.

**Rejected: a text box.** Either it understands nothing, which is worse than not offering it, or it
guesses by keyword, which works until the first visitor types something else and then looks broken.

**Rejected: an autoplaying timeline.** It shows the same thing without the visitor doing anything,
which is exactly why it convinces nobody: a video of an app proves nothing, and this would look like
one.

### Failure is demonstrated, not avoided

Two of the four beats end in the command **not** running. That is deliberate and it is the point:
success proves an integration, refusal proves a boundary, and the boundary is the part that is ours.

The confirmation beat declines on purpose. A demonstration where the visitor is asked and then says
yes shows a dialog; one where the answer is no shows that the answer is obeyed.

### The look change is the finale, because a look here is composed rather than switched

A look in this demo changes three things: the design tokens, through a class on the document; the
icon set, through the composition root; and the wording, through translation overrides, also through
the composition root. The last two are decided once at bootstrap, which is why switching a look
reloads the page.

That was found while building, and it rules out the look change as an early beat: a reload mid-run
destroys the conversation and the tool result never reaches the agent. A demonstration that is honest
everywhere else cannot have its most visible moment be a lie about the protocol.

Making it live was rejected. It would mean re-composing icons and translations at runtime, which is a
rebuild of how this demo does looks, and it would blur the very thing that arrangement demonstrates:
that a look is a **composition** decision rather than a colour switch.

So it goes last, where the reload costs nothing because the demonstration is over, and the panel says
why. The limitation stops being an apology and becomes the most interesting sentence in the sequence.

Its place is taken by the overview, which changes the whole content area instantly and shows a second
platform idea besides: a screen that is not a document, with no tab of its own.

### The refusal beat rides an existing gate

The margin surface has needed the accounting role since long before any of this. Using it means the
demo is not staged: the agent is refused by a rule that was written for a different reason, which is
the strongest available evidence that the rule is real. Signing in with the demo's own session
control and asking again is the second half of the same claim.

### The commands are real contributions, not props

The commands the script drives are declared the way a product would declare them — described, with
typed arguments, `callable` where they are meant to be reachable — and they work from the command
palette too. A visitor who ignores the chat still gets a better demo, and a reader who copies the code
copies something honest.

Their arguments are chosen to exercise more than one kind: a choice for which quote, a choice for
which look. A demonstration where every argument is a string would not show what the closed set of
kinds buys.

### The chat lives in the right-hand dock

The demo's layout already declares `right-panel`, and it is empty. An assistant beside the work rather
than on top of it is also the arrangement the workbench is for: the visitor can drag it elsewhere,
which is itself worth seeing.

## Risks / Trade-offs

- **A visitor believes there is a model behind it and feels tricked.** → The panel says it is scripted
  where it cannot be missed, not in a tooltip. This is the risk that decides the beat, so it is
  handled first rather than mitigated.
- **The script rots when the demo changes.** → Every beat drives a command by id through the published
  seam, so a renamed command breaks a test rather than the deployed page. The beats are covered by
  tests that assert what the workbench did, not what the panel drew.
- **Demonstration code gets copied into a product.** → It is a demo weaver in the demo, documented as
  a recipe, and it holds nothing a product should reuse verbatim. The reusable part is
  `@loom/ag-ui`, which is published and documented on its own.
- **The refusal beat depends on a starting session.** → The demo does not start anonymous: it starts
  signed in as the accounting account, which was found while building. So the beat rides the role
  rather than the login. It is answered on the accounting account and refused on the sales one, and
  the beat reads the session rather than assuming it, so a visitor who switched earlier sees a
  consistent half rather than a wrong sentence. Switching a role also shows the offered-tool count
  drop, which the login could not.
- **Four beats is not much.** → It is deliberately short. Each one makes a claim that can be checked
  in a few seconds, and a longer sequence would be watched rather than tried.

## Open Questions

- Whether the closing beat, revoking the capability from the permissions surface, needs any prompting
  in the panel or is better left for the visitor to find. Deferrable: it changes a sentence, not the
  work, and it is easier to judge once the panel exists.
