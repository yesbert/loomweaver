(function () {
  const messenger = new globalThis.Penpal.WindowMessenger({
    remoteWindow: globalThis.parent,
    allowedOrigins: ['*'],
  });

  globalThis.Penpal.connect({ messenger })
    .promise.then(function (ctx) {
      return ctx.registerSurface({
        id: 'payments.matching',
        title: 'product.payments.title',
        icon: 'payments',
        iframe: '/payments/view.html',
        retain: 'always',
        closable: false,
        routable: { path: 'finance/matching' },
      });
    })
    .catch(function (error) {
      console.error('[payments] activation failed', error);
    });
})();
