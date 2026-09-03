import starlight from '@astrojs/starlight';
import { defineConfig, passthroughImageService } from 'astro/config';

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
    starlight({
      title: 'LoomWeaver',
      description:
        'A domain-agnostic plugin & UI platform. Products run as plugin bundles on top of it; the platform itself contains zero domain logic.',
      favicon: '/loomweaver-icon.png',
      logo: {
        src: './generated/assets/loomweaver-icon.png',
        alt: 'LoomWeaver',
      },
      customCss: ['./src/styles/brand.css'],
      // The footer carries the legal links and the consent banner. Starlight renders it on every
      // page, the splash landing page included, so overriding it reaches the whole site at once.
      // Umami itself is not loaded here: the banner appends the script only once somebody agrees.
      components: {
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
      sidebar: [
        { label: 'Overview', link: '/overview/' },
        {
          label: 'Guides',
          items: [
            { label: 'Architecture', link: '/architecture/' },
            { label: 'Getting started', link: '/getting-started/' },
            { label: 'Manual setup', link: '/manual-setup/' },
            { label: 'Samples', link: '/samples/' },
            { label: 'The plugin system', link: '/plugins/' },
            { label: 'Scaffolding', link: '/scaffolding/' },
            { label: 'AG-UI agents', link: '/ag-ui-agents/' },
            { label: 'Backend integration', link: '/backend-integration/' },
          ],
        },
        {
          label: 'Authoring a weaver',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/authoring-a-weaver/' },
            {
              label: 'Surfaces in a sidebar',
              link: '/weaver/sidebar-surfaces/',
            },
            { label: 'View state that survives', link: '/weaver/view-state/' },
            { label: 'Unsaved changes', link: '/weaver/unsaved-changes/' },
            { label: "Your plugin's own store", link: '/weaver/plugin-state/' },
            { label: 'Containers', link: '/weaver/containers/' },
            { label: 'The content area', link: '/weaver/content-area/' },
            {
              label: 'Sub-routes and follows',
              link: '/weaver/sub-routes-and-follows/',
            },
            { label: 'Context menus', link: '/weaver/menus/' },
            {
              label: 'Sandboxed surfaces',
              link: '/weaver/sandboxed-surfaces/',
            },
            { label: 'Commands and their triggers', link: '/weaver/commands/' },
            { label: 'Access gating', link: '/weaver/access-gating/' },
            { label: 'Icons and theme', link: '/weaver/icons-and-theme/' },
            {
              label: 'Host UI and host facts',
              link: '/weaver/host-ui-and-facts/',
            },
            { label: 'Settings sections', link: '/weaver/settings/' },
            { label: 'Translations', link: '/weaver/i18n/' },
          ],
        },
        {
          label: 'Building a distribution',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/building-a-distribution/' },
            { label: 'Layout', link: '/distribution/layout/' },
            {
              label: 'Content-area routing',
              link: '/distribution/content-routing/',
            },
            { label: 'Workspaces', link: '/distribution/workspaces/' },
            { label: 'Resetting', link: '/distribution/resetting/' },
            {
              label: 'Switching capabilities off',
              link: '/distribution/switching-capabilities-off/',
            },
            {
              label: 'Surface retention',
              link: '/distribution/surface-retention/',
            },
            { label: 'Branding', link: '/distribution/branding/' },
            { label: 'Capabilities', link: '/distribution/capabilities/' },
            { label: 'Auth integration', link: '/distribution/auth/' },
            { label: 'Persistence stores', link: '/distribution/persistence/' },
            {
              label: 'Windows and sync',
              link: '/distribution/windows-and-sync/',
            },
            { label: 'Frame plugins', link: '/distribution/frame-plugins/' },
            { label: 'Plugin store', link: '/distribution/plugin-store/' },
            {
              label: 'Icons, translations and rewording',
              link: '/distribution/icons-and-i18n/',
            },
            {
              label: 'Recomposing host chrome',
              link: '/distribution/recomposing-chrome/',
            },
            { label: 'PWA and delivery', link: '/distribution/pwa/' },
          ],
        },
        {
          label: 'Distribution API',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/distribution-api/' },
            {
              label: 'Composition',
              link: '/distribution-api/composition/',
            },
            {
              label: 'Switches',
              link: '/distribution-api/switches/',
            },
            { label: 'Tabs', link: '/distribution-api/tabs/' },
            { label: 'Panes', link: '/distribution-api/panes/' },
            {
              label: 'Workspaces',
              link: '/distribution-api/workspaces/',
            },
            {
              label: 'Sidebars',
              link: '/distribution-api/sidebars/',
            },
            { label: 'Resetting', link: '/distribution-api/reset/' },
            {
              label: 'Dialogs and toasts',
              link: '/distribution-api/dialogs-and-toasts/',
            },
            {
              label: 'Settings',
              link: '/distribution-api/settings/',
            },
            {
              label: 'Commands',
              link: '/distribution-api/commands/',
            },
            { label: 'Session', link: '/distribution-api/session/' },
            {
              label: 'Appearance',
              link: '/distribution-api/appearance/',
            },
            {
              label: 'Plugins at runtime',
              link: '/distribution-api/plugins-at-runtime/',
            },
            {
              label: 'Windows, sync and updates',
              link: '/distribution-api/windows-and-sync/',
            },
          ],
        },
        {
          label: 'Concepts',
          items: [
            {
              label: 'Surfaces and panes',
              link: '/concepts/surfaces-and-panes/',
            },
            { label: 'The address', link: '/concepts/the-address/' },
            {
              label: 'Retention and unsaved work',
              link: '/concepts/retention-and-unsaved-work/',
            },
            {
              label: 'Capabilities and trust',
              link: '/concepts/capabilities-and-trust/',
            },
            { label: 'Workspaces', link: '/concepts/workspaces/' },
          ],
        },
        // Listed rather than autogenerated: Starlight derives `autogenerate` from its own
        // collection, and we load the synced docs with our own glob() loader, so it matched
        // nothing and this group rendered empty. sync-docs.mjs fails the build if any page under
        // docs/ is missing from this sidebar, which is the guard the autogeneration used to be.
        {
          label: 'Platform reference',
          items: [
            { label: 'Shell anatomy', link: '/reference/shell-anatomy/' },
            { label: 'Access gating', link: '/reference/access-gating/' },
            { label: 'Routing', link: '/reference/routing/' },
            {
              label: 'Callable commands',
              link: '/reference/callable-commands/',
            },
            { label: 'Agent tools', link: '/reference/agent-tools/' },
            { label: 'Design tokens', link: '/reference/design-tokens/' },
            { label: 'Icons', link: '/reference/icons/' },
            { label: 'Accessibility', link: '/reference/accessibility/' },
            { label: 'Operations', link: '/reference/operations/' },
            { label: 'Glossary', link: '/glossary/' },
          ],
        },
        {
          label: 'For AI assistants',
          items: [
            {
              label: 'llms.txt',
              link: '/llms.txt',
              attrs: { target: '_blank' },
            },
            {
              label: 'llms-full.txt',
              link: '/llms-full.txt',
              attrs: { target: '_blank' },
            },
          ],
        },
      ],
    }),
  ],
});
