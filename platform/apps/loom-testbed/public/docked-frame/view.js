(function () {
  const set = function (testid, value) {
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
    methods: {
      render: function (state) {
        globalThis.LwFrame.applySurfaceState(state);
        set('frame-instance', state.instanceId || '—');
        set('frame-tab', state.tab === '' ? '(none)' : state.tab);
        set('frame-theme', state.theme);
        set(
          'frame-params',
          state.params ? JSON.stringify(state.params) : '(none)',
        );
      },
    },
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
                set('frame-nav-result', 'resolved');
              },
              function () {
                set('frame-nav-result', 'rejected');
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
