import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { defineConfig, passthroughImageService } from 'astro/config';
import pageMeta from './generated/page-meta.json' with { type: 'json' };
import { sidebar } from './sidebar.mjs';

export default defineConfig({
  site: 'https://loomweaver.dev',
  // The Distribution API spent its first day under /reference/distribution/ before it became a
  // group of its own; a bookmark or a search index from that day lands on the moved page.
  redirects: {
    '/reference/distribution/': '/distribution-api/',
    '/reference/distribution/appearance/': '/distribution-api/appearance/',
    '/reference/distribution/commands/': '/distribution-api/commands/',
    '/reference/distribution/composition/': '/distribution-api/composition/',
    '/reference/distribution/dialogs-and-toasts/':
      '/distribution-api/dialogs-and-toasts/',
    '/reference/distribution/panes/': '/distribution-api/panes/',
    '/reference/distribution/plugins-at-runtime/':
      '/distribution-api/plugins-at-runtime/',
    '/reference/distribution/reset/': '/distribution-api/reset/',
    '/reference/distribution/session/': '/distribution-api/session/',
    '/reference/distribution/settings/': '/distribution-api/settings/',
    '/reference/distribution/sidebars/': '/distribution-api/sidebars/',
    '/reference/distribution/switches/': '/distribution-api/switches/',
    '/reference/distribution/tabs/': '/distribution-api/tabs/',
    '/reference/distribution/windows-and-sync/':
      '/distribution-api/windows-and-sync/',
    '/reference/distribution/workspaces/': '/distribution-api/workspaces/',
  },
  // Passthrough keeps sharp (and its LGPL libvips binary) out of the tree; the site
  // ships two brand PNGs, so optimisation buys nothing worth a copyleft dependency.
  image: { service: passthroughImageService() },
  integrations: [
    // Declared here rather than left to Starlight, which adds its own copy only when the list does
    // not already carry one. Starlight's copy writes <loc> and nothing else; every page here has a
    // date in its history, and a crawler that is told when a page last changed comes back for the
    // ones that did. sync-docs.mjs writes generated/page-meta.json from `git log`.
    sitemap({
      serialize: (item) => {
        const url = new URL(item.url);
        const lastmod = pageMeta[url.pathname];
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    starlight({
      title: 'LoomWeaver',
      description: 'LoomWeaver: open-source plugin platform for Angular workbenches.',
      // Square, and small enough to be worth fetching. Dropping this option does not remove the
      // tag — Starlight falls back to /favicon.svg, which this site does not ship.
      favicon: '/icon-32.png',
      // The same mark at the resolution the header actually paints it: it renders about 24px
      // tall, and the 1280px master was 110 KB fetched eagerly on every page for that.
      logo: {
        src: './generated/assets/loomweaver-icon-256.png',
        // Decorative: the link it sits in already carries the word "LoomWeaver" beside it, and a
        // name here made a screen reader read the site title twice.
        alt: '',
      },
      customCss: ['./src/styles/brand.css'],
      // The footer carries the legal links and the consent banner. Starlight renders it on every
      // page, the splash landing page included, so overriding it reaches the whole site at once.
      // Umami itself is not loaded here: the banner appends the script only once somebody agrees.
      components: {
        // The social card, the square icon set and og:type on the landing page. Starlight's own
        // head declares twitter:card=summary_large_image and then names no image at all.
        Head: './src/components/Head.astro',
        Footer: './src/components/Footer.astro',
        // The demo is the fastest way to understand what this is, but it was reachable only from the
        // landing page. Overriding SocialIcons rather than Header puts a link to it beside the GitHub
        // icon on every page, and reaches the mobile menu too, because Starlight renders the same
        // component in both places.
        SocialIcons: './src/components/SocialIcons.astro',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/yesbert/loomweaver',
        },
      ],
      sidebar,
    }),
  ],
});
