# @loomweaver/ag-ui

Describes the workbench's own commands to an [AG-UI](https://docs.ag-ui.com) agent and runs what it
asks for, so a weaver keeps no tool registry of its own.

```ts
import { commandTools } from '@loomweaver/ag-ui';

const tools = commandTools(ctx);

// when a run starts
agent.runAgent({ tools: tools.list(), ...rest });

// for every event the run produces
const answer = await tools.receive(event);
if (answer) messages.push(answer);
```

That is the whole integration. The actions the agent can reach are the ones the workbench already
knows about, narrowed by everything that would refuse them — so an agent reaches what the user could
have reached, and nothing more.

## What it does not do

- **No transport.** Opening a connection, choosing SSE or a socket, retrying and authenticating are
  yours.
- **No user interface.** Not a chat, not a message list, not a rendering of anything.
- **No agent.** It never decides what to do; it carries what was decided.
- **No shared state, reasoning display or subagent handling.** Those events pass by untouched.

It is headless and framework-neutral: no Angular, no observables. You bring the stream and hand it
one event at a time.

## Stability

**This package's stability follows AG-UI, not the platform.** It shares a version number with the
other `@loomweaver/*` packages because they are released together, and that number says which platform
release it was built against. It says nothing about the protocol, which is at `0.0.x` and still
moving. A break there is answered by publishing at the next platform version.

`@ag-ui/core` and `@loomweaver/plugin-sdk` are peer dependencies, so a weaver that also builds its own
agent resolves one copy of each rather than two.

## Documentation

The full guide, including the hook that lets you confirm or decline a call before it runs, is at
[docs/reference/agent-tools.md](https://github.com/yesbert/loomweaver/blob/main/docs/reference/agent-tools.md).
