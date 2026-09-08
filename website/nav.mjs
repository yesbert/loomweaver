/* The entries the header offers on every page, beside the site title. They are the doors a
   visitor arrives through, not the whole tree — that is sidebar.mjs, and every link here must
   also be in there, so a page cannot be reachable from the header and absent from the
   navigation. The landing page renders the same list a second time on narrow screens, where the
   header has no room and, having no sidebar, no menu button either. */
export const mainNav = [
  { label: 'Docs', link: '/overview/' },
  { label: 'Get started', link: '/getting-started/' },
  { label: 'Changelog', link: '/changelog/' },
];
