(function () {
  const connection = globalThis.Penpal.connect({
    messenger: new globalThis.Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
    methods: {
      render: function (state) {
        globalThis.LwFrame.applySurfaceState(state);
      },
    },
  });

  connection.promise.catch(function (error) {
    console.error('[store-full view] host connection failed', error);
  });
})();
