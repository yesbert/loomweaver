(function () {
  const TOAST_MS = 5000;
  const Penpal = globalThis.Penpal;
  const messenger = new Penpal.WindowMessenger({
    remoteWindow: globalThis.parent,
    allowedOrigins: ['*'],
  });
  const connection = Penpal.connect({ messenger });

  connection.promise
    .then(function (ctx) {
      return Promise.all([
        ctx.toast({ message: 'testbed.sandbox.toast', kind: 'success', timeoutMs: TOAST_MS }),
        ctx.registerSurface({
          id: 'sandbox-rpc.view',
          title: 'testbed.sandbox.title',
          icon: 'testbedSandbox',
          iframe: '/sandbox-rpc/view.html',
          retain: 'always',
          routable: {
            path: 'sandbox-rpc',
            subRoutes: ['overview', 'architecture'],
          },
        }),
      ]);
    })
    .catch(function (error) {
      console.error('[sandbox-rpc] plugin failed', error);
    });
})();
