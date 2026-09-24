## Context

See proposal.md for the motivation. A content tab's own label (title, whether it is a literal, icon,
badge) is stored with the tab in the pane tree. The tab service changes it in two ways, both through
opening: in the pane carrying the address it replaces the open tab and then navigates to it, and for
a tab standing in another pane it refines the label there without navigating. There is no way to
change a label without opening. The live calls a plugin has for what it registered, renaming a
surface and changing a surface's badge, check that the plugin owns the surface and cross the sandbox
with their input rebuilt.

## Goals / Non-Goals

**Goals:**
- A plugin keeps an open tab's own label true without moving the person.
- One operation for every pane of the main area.

**Non-Goals:**
- Opening a tab in the background. That is a different operation, with its own questions about
  previews and order, and nobody has asked for it.
- Tabs of a container's inner panes. Their labels come from the container's own open call.
- Changing a label the workbench worked out from a declaration: the change makes the given fields
  the tab's own, as opening with them does.

## Decisions

**A verb of its own, `updateContentTab(path, label)`, not an option on opening.** Updating is not
opening: for content with no open tab the call must do nothing, where an "open without focus" flag
would open a tab behind the others, and a product that only wants to keep a badge true would first
have to find out whether the tab is open. The name follows the plugin's other live calls
(`updateSurfaceBadge`, `updateSurfaceAction`).
*Alternative considered:* `openContentTab({ ..., reveal: false })`, rejected for the reason above.

**The label is a partial of what opening takes.** Its fields are the label fields of the input to
opening: title with its literal flag, icon, and badge, where `null` takes the tab's own badge away. A
field left out keeps the tab's value, so a badge can change without restating the title.

**The owner is the plugin that registered the content.** The path is matched to its content route,
and the call changes nothing unless the calling plugin registered that route, as the surface calls
check the surface's owner. An unknown path, a path with no open tab and a foreign route are silent
no-ops, with a development warning for the foreign one.

**Both panes go through one pure function over the pane trees.** The service walks every dock's tree
once and patches the tab rooted at the path wherever it stands, the address pane included, and
commits only the trees that changed. It never calls the router. The service file is near its size
limit, so the walk and the patch live in a small module of their own beside it.

**The sandbox rebuilds the label.** The RPC method takes the path as a string and rebuilds the label
field by field, with the badge through the same sanitiser the other badge calls use, before it
reaches the plugin context.

## Risks / Trade-offs

- [A change arriving before a restored tab has its content] → The tab takes the label as its own and
  keeps it, as a tab opened with a label does.
