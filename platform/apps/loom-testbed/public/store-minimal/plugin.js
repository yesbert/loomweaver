(function () {
  const Penpal = globalThis.Penpal;
  const connection = Penpal.connect({
    messenger: new Penpal.WindowMessenger({ remoteWindow: globalThis.parent, allowedOrigins: ['*'] }),
  });

  connection.promise
    .then(function (ctx) {
      return ctx.registerSurface({
        id: 'store-hello.view',
        title: 'Store plugin (minimal)',
        icon: 'info',
        iframe: '/store-hello/view.html',
        routable: { path: 'store-hello' },
      });
    })
    .catch(function (error) {
      console.error('[store-hello] plugin failed', error);
    });
})();
