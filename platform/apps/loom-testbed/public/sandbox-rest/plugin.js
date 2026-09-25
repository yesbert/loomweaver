(function () {
  const Penpal = globalThis.Penpal;
  const connection = Penpal.connect({
    messenger: new Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
  });

  connection.promise
    .then(function (ctx) {
      return Promise.all([
        ctx.registerSurface({
          id: 'sandbox-rest.view',
          title: 'testbed.sandboxRest.title',
          icon: 'info',
          iframe: '/sandbox-rest/view.html',
          routable: {
            path: 'sandbox-rest',
            rest: true,
          },
        }),
        ctx.registerSurface({
          id: 'sandbox-rest.docked',
          title: 'testbed.sandboxRest.docked',
          icon: 'info',
          docks: ['right-panel'],
          order: 2,
          iframe: '/docked-frame/view.html?sandbox=1',
        }),
      ]);
    })
    .catch(function (error) {
      console.error('[sandbox-rest] plugin failed', error);
    });
})();
