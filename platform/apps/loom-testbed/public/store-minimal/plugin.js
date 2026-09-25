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
      return ctx.registerSurface({
        id: 'store-minimal.view',
        title: 'Store plugin (minimal)',
        icon: 'info',
        iframe: '/store-minimal/view.html',
        routable: { path: 'store-minimal' },
      });
    })
    .catch(function (error) {
      console.error('[store-minimal] plugin failed', error);
    });
})();
