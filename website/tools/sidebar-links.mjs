/* Every link the sidebar tree holds, however deep its groups nest, so a page is found in it by its
   whole route and never because a longer route starts with it. */
export function sidebarLinks(tree) {
  return new Set(tree.flatMap((entry) => (entry.items ? [...sidebarLinks(entry.items)] : [entry.link])));
}
