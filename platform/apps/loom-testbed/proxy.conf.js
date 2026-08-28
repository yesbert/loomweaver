// Dev-only API proxy for the studio app when run under .NET Aspire (`aspire run`). Aspire injects
// the BFF's URL as API_HTTP / API_HTTPS; we forward same-origin `/api` calls to it so the browser
// only ever talks to the trusted-HTTPS Aspire endpoint (no CORS, no API URL in the client bundle).
//
// Without Aspire (plain `nx serve`, E2E, pure UI work) there is no backend to proxy to. We warn and
// disable the `/api` proxy rather than aborting the dev server — the chrome still serves and the
// hint stays visible.
const target = process.env.API_HTTPS || process.env.API_HTTP;

if (!target) {
  console.warn(
    '[proxy] API endpoint not configured — /api proxy disabled. Run via Aspire (`aspire run`) for a working backend.',
  );
  module.exports = {};
} else {
  module.exports = {
    '/api': {
      target,
      secure: false,
      changeOrigin: true,
    },
  };
}
