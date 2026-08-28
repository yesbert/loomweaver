(function () {
  const Penpal = globalThis.Penpal;
  const connection = Penpal.connect({
    messenger: new Penpal.WindowMessenger({ remoteWindow: globalThis.parent, allowedOrigins: ['*'] }),
  });

  connection.promise
    .then(function (ctx) {
      return Promise.all([
        ctx.registerSurface({
          id: 'sandbox-static.view',
          title: 'testbed.sandboxStatic.title',
          icon: 'info',
          iframe: '/sandbox-static/view.html',
          routable: {
            path: 'sandbox-static',
            rest: true,
          },
        }),
        ctx.registerSurface({
          id: 'sandbox-static.docked',
          title: 'testbed.sandboxStatic.docked',
          icon: 'info',
          docks: ['secondary'],
          order: 2,
          iframe: '/docked-frame/view.html?sandbox=1',
        }),
      ]);
    })
    .catch(function (error) {
      console.error('[sandbox-static] plugin failed', error);
    });
})();
