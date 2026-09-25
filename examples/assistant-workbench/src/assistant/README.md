# Assistant

The assistant of this example, on the shape `loomweaver weaver --agent` generates.

- `lib/agent/assistant-connection.ts` is the workbench's half: the commands offered as tools, and
  the place where the assistant asks before a call whose command says so.
- `lib/agent/assistant-agent.ts` is the agent. It talks to OpenRouter, runs several rounds and
  speaks the AG-UI protocol back. `MODEL` at its top names the model.
- `lib/agent/assistant-agent-panel.ts` draws the conversation. It hands every event to the
  connection and each answer back to the agent, which is what an agent that runs several rounds
  needs.
- `lib/agent/openrouter-key.ts` and `openrouter-key-form.ts` keep the key in this browser. They go
  when the agent moves behind your own endpoint.
- `lib/plugin/assistant.plugin.ts` activates the connection and docks the panel on the right.
