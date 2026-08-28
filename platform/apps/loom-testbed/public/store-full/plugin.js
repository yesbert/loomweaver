(function () {
  const Penpal = globalThis.Penpal;
  let host = null;
  let settings = null;

  const connection = Penpal.connect({
    messenger: new Penpal.WindowMessenger({ remoteWindow: globalThis.parent, allowedOrigins: ['*'] }),
    methods: {
      settingsChanged: function (sectionId, values) {
        const first = settings === null;
        settings = values;
        if (first || !host) {
          return;
        }
        const text = values.loud ? String(values.greeting).toUpperCase() : String(values.greeting);
        host.toast({ message: '[store-full] ' + text }).catch(function () {
        });
      },
    },
  });

  connection.promise
    .then(function (ctx) {
      host = ctx;
      return ctx
        .registerSurface({
          id: 'store-full.view',
          title: 'testbed.storeFull.title',
          icon: 'document',
          iframe: '/store-full/view.html',
          routable: { path: 'store-full' },
        })
        .then(function () {
          return ctx.registerSettingsSection({
            id: 'prefs',
            title: 'Store plugin (full)',
            rows: [
              {
                id: 'greeting',
                label: 'Greeting',
                description: 'Shown as a toast whenever you change a setting here.',
                control: { kind: 'text', value: 'Hello from the store!' },
              },
              {
                id: 'loud',
                label: 'Shout',
                description: 'Uppercases the greeting.',
                control: { kind: 'toggle', value: false },
              },
            ],
          });
        });
    })
    .catch(function (error) {
      console.error('[store-full] plugin failed', error);
    });
})();
