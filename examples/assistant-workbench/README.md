# Assistant Workbench

A support inbox built as a LoomWeaver workbench that an AI assistant can operate: it lists, opens,
assigns and replies to tickets by calling the same commands the buttons call, and it never reaches
further than the person at the keyboard could.

It is the runnable example for the article on dev.to and installs the published LoomWeaver packages
from the registry, as any product would. Nothing here reaches into `../../platform`.

## Run it

```bash
npm install
npm start          # http://127.0.0.1:4200
```

Open the assistant panel on the right and paste an [OpenRouter](https://openrouter.ai) API key. The
key stays in this browser's local storage and is sent to OpenRouter and nowhere else. The model is
named once, in `src/assistant/src/lib/agent/assistant-agent-source.ts`; the default is a free one, which
OpenRouter limits to about fifty requests a day per key.

Then ask for something, for example: *open the ticket about the blank invoice PDF, assign it to Dana
and reply that the fix ships on Monday.* The reply asks you first, because it is the one command
marked as consequential.

## What is where

- `src/tickets/` is the domain: an in-memory ticket store, five callable commands with described
  arguments, and the view with the buttons a person would click.
- `src/assistant/` is the assistant: the AG-UI connection the platform scaffolds, a panel, and the
  agent that calls OpenRouter and speaks the protocol back.
- `src/app/` is the composition root the CLI wrote.

For production the agent's run moves behind your own endpoint; the panel, the connection and the
commands stay as they are.
