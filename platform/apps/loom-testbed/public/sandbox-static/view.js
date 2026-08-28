(function () {
  const connection = globalThis.Penpal.connect({
    messenger: new globalThis.Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
    methods: {
      render: function (state) {
        globalThis.LwFrame.applySurfaceState(state);
        const rest = document.getElementById('rest');
        if (rest) {
          rest.textContent = state.rest ? state.rest : '(none)';
        }
      },
    },
  });

  function go(rest) {
    connection.promise.then(function (host) {
      return host.navigate('sandbox-static' + rest);
    });
  }

  document.getElementById('go-deep').addEventListener('click', function () {
    go('/programs/205470/pricing');
  });
  document.getElementById('go-query').addEventListener('click', function () {
    go('/programs/205470/pricing?treaty=886320');
  });
  document.getElementById('go-root').addEventListener('click', function () {
    go('');
  });

  connection.promise.catch(function (error) {
    console.error('[sandbox-info view] host connection failed', error);
  });
})();
