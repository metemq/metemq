Package.describe({
  name: 'metemq:metemq',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'MeteMQ',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'mqtt': '1.11.2',
  'mqtt-emitter': '1.2.4'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.4.1');
  api.use('underscore')
  api.use('barbatus:typescript@0.3.3');

  api.mainModule('client/index.ts', 'client');
  api.mainModule('server/index.ts', 'server');
});

Package.onTest(function(api) {
  // api.use('barbatus:typescript@0.3.3');
  api.use('ecmascript');
  api.use('tinytest');
  api.use('metemq:metemq');

  api.mainModule('test/index.js');
});
