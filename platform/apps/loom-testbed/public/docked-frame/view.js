(function () {
  const showText = function (testid, value) {
    const node = document.querySelector('[data-testid="' + testid + '"]');
    if (node) {
      node.textContent = value;
    }
  };

  const connection = globalThis.Penpal.connect({
    messenger: new globalThis.Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
    methods: globalThis.LwFrame.surfaceMethods({
      render: function (state) {
        globalThis.LwFrame.applySurfaceState(state);
        showText('frame-instance', state.instanceId || '—');
        showText('frame-tab', state.tab === '' ? '(none)' : state.tab);
        showText('frame-theme', state.theme);
        showText(
          'frame-params',
          state.params ? JSON.stringify(state.params) : '(none)',
        );
      },
    }),
  });

  connection.promise.then(
    function (host) {
      const button = document.querySelector('[data-testid="frame-navigate"]');
      if (button) {
        button.addEventListener('click', function () {
          Promise.resolve()
            .then(function () {
              return host.navigate('somewhere');
            })
            .then(
              function () {
                showText('frame-nav-result', 'resolved');
              },
              function () {
                showText('frame-nav-result', 'rejected');
              },
            );
        });
      }
    },
    function (error) {
      console.error('[docked-frame view] host connection failed', error);
    },
  );
})();
