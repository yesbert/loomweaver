# Assistant Workbench

A support inbox built as a LoomWeaver workbench that an AI assistant can operate: it lists, opens,
assigns and replies to tickets by calling the product's commands, and it never reaches further than
the person at the keyboard could. A command and the button beside it end in the same function, so
what the assistant does is what a click does.

It is the runnable example for the article on dev.to and installs the published LoomWeaver packages
from the registry, as any product would. Nothing here reaches into `../../platform`.

## Run it

```bash
npm install
npm start          # http://127.0.0.1:4200
```

Open the assistant panel on the right and paste an [OpenRouter](https://openrouter.ai) API key. The
key stays in this browser's local storage and is sent to OpenRouter and nowhere else. The model is
named once, in the `MODEL` constant at the top of
`src/assistant/src/lib/agent/assistant-agent.ts`; the default is a free one, which OpenRouter
limits to about fifty requests a day per key.

Free models come and go, so the default may be gone by the time you read this. The panel then shows
what OpenRouter answered, and the example is not broken: pick another model from
[the free ones that can call tools](https://openrouter.ai/models?fmt=cards&supported_parameters=tools&max_price=0)
and put its slug in that one constant. Tool calling is the part that matters, because everything the
assistant does here it does by calling a command.

Then ask for something, for example: *open the ticket about the blank invoice PDF, assign it to Dana
and reply that the fix ships on Monday.* The reply asks you first, because it is the one command
that declares `agentConsent: 'ask'`; the connection reads that off the call.

## What is where

Read it in this order:

1. [`src/tickets/`](src/tickets/README.md) is the domain: the tickets, what can be done with them,
   and the five commands that offer it to a caller.
2. [`src/assistant/`](src/assistant/README.md) is the assistant: the connection the platform
   scaffolds, the agent that calls OpenRouter, and the panel between them.
3. `src/app/` is the composition root the CLI wrote: the layout, the grants and the two plugins.

For production the agent's run moves behind your own endpoint: `assistant-agent.ts` changes and the
key form goes, while the panel, the connection and the commands stay as they are.
