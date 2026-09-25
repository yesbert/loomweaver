(function () {
  const PREFIX = 'sandbox-rest';

  const connection = globalThis.Penpal.connect({
    messenger: new globalThis.Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
    methods: globalThis.LwFrame.surfaceMethods({
      render: function (state) {
        globalThis.LwFrame.applySurfaceState(state);
        const rest = document.getElementById('rest');
        if (rest) {
          rest.textContent = state.rest ? state.rest : '(none)';
        }
      },
    }),
  });

  function go(rest) {
    connection.promise.then(function (host) {
      return host.navigate(PREFIX + rest);
    });
  }

  document.getElementById('go-deep').addEventListener('click', function () {
    go('/guide/setup');
  });
  document.getElementById('go-query').addEventListener('click', function () {
    go('/guide/setup?step=2');
  });
  document.getElementById('go-root').addEventListener('click', function () {
    go('');
  });

  connection.promise.catch(function (error) {
    console.error('[sandbox-rest view] host connection failed', error);
  });
})();
