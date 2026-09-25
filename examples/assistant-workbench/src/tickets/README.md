# Tickets

The domain of this example: support tickets, and what a person or the assistant can do with them.

- `lib/tickets/ticket-store.ts` holds the tickets in memory, with the statuses, the assignees and
  the two shapes a command answers with, a summary and the detail.
- `lib/plugin/ticket-actions.ts` is where every change happens. Assigning, replying and setting a
  status change the ticket and show it, and a command and the button beside it both end here.
- `lib/plugin/tickets.plugin.ts` registers the five callable commands with described arguments, the
  list docked in the left sidebar and the ticket view that opens as a tab per ticket.
- `lib/views/` holds the list and the ticket view.

Only `tickets.reply` declares `agentConsent: 'ask'`, so it is the one call the assistant asks about.
