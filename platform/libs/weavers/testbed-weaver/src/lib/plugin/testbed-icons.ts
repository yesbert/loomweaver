import { PluginContext } from '@loomweaver/plugin-sdk';

const OPEN =
  'fill="none" stroke="currentColor" stroke-width="1.5" ' +
  'stroke-linecap="round" stroke-linejoin="round"';

function glyph(body: string): string {
  return `<svg viewBox="0 0 24 24" ${OPEN} aria-hidden="true">${body}</svg>`;
}

const SHAPES: Readonly<Record<string, string>> = {
  testbedHome:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/>' +
    '<rect x="8.5" y="8.5" width="7" height="7" rx="1.5"/>',
  testbedList:
    '<path d="M8 7h11M8 12h11M8 17h11"/>' +
    '<path d="M4.6 7h.1M4.6 12h.1M4.6 17h.1"/>',
  testbedEntry:
    '<rect x="4" y="4" width="16" height="16" rx="3"/>' +
    '<path d="M8 10h8M8 14h5"/>',
  testbedDocument: '<path d="M6 3.5h7.5l5 5v12H6z"/><path d="M13.5 3.5v5h5"/>',
  testbedDashboard:
    '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/>' +
    '<rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/>' +
    '<rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/>' +
    '<rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  testbedTrends:
    '<path d="M3.5 16.5l5-5 4 4 8-8"/><path d="M20.5 7.5h-5m5 0v5"/>',
  testbedOpen: '<circle cx="12" cy="12" r="8"/>',
  testbedWaiting: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  testbedResolved:
    '<circle cx="12" cy="12" r="8"/><path d="M8.5 12.25l2.5 2.5 4.5-5"/>',
  testbedUrgent: '<path d="M12 4l8.5 15h-17z"/><path d="M12 10v4M12 16.4v.2"/>',
  testbedUser:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
  testbedUsers:
    '<circle cx="9" cy="12" r="5.5"/><circle cx="16" cy="12" r="5.5"/>',
  testbedUserSwitch:
    '<circle cx="12" cy="12" r="5"/>' +
    '<path d="M4 9.5A9 9 0 0 1 12 4"/><path d="M20 14.5A9 9 0 0 1 12 20"/>',
  testbedSignOut:
    '<path d="M14 5.5H6.5v13H14"/><path d="M12.5 12h8m0 0l-3-3m3 3l-3 3"/>',
  testbedStepDown: '<path d="M12 4v11m0 0l-4-4m4 4l4-4"/><path d="M5 20h14"/>',
  testbedShield:
    '<path d="M12 3.5l7 2.5v6c0 4-3 7-7 8.5-4-1.5-7-4.5-7-8.5V6z"/>',
  testbedKey:
    '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H20m-3 0v3m3-3v2"/>',
  testbedBuilding:
    '<rect x="5" y="3.5" width="14" height="17" rx="2"/>' +
    '<path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6"/>',
  testbedStar:
    '<path d="M12 4l2.4 5.1 5.6.8-4 4 .9 5.6-4.9-2.7-4.9 2.7.9-5.6-4-4 5.6-.8z"/>',
  testbedPalette:
    '<circle cx="12" cy="12" r="8"/><path d="M9 10v.2M12 8.5v.2M15 10v.2"/>',
  testbedSandbox:
    '<path d="M12 3.5l8 4.25v8.5l-8 4.25-8-4.25v-8.5z"/>' +
    '<path d="M4 7.75l8 4.25 8-4.25M12 12v8.5"/>',
};

export function registerIcons(ctx: PluginContext): void {
  const icons: Record<string, string> = {};
  for (const [name, body] of Object.entries(SHAPES)) {
    icons[name] = glyph(body);
  }
  ctx.contributeIcons(icons);
}
