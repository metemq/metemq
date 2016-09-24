Package.describe({
  name: 'metemq:metemq',
  version: '0.4.0',
  // Brief, one-line summary of the package.
  summary: 'MeteMQ',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'mqtt': '1.12.0',
  'mqtt-emitter': '1.2.4',
  'mosca': '2.1.0',    // For testing
  'portfinder': '1.0.3',
  'metemq-broker': '0.0.1'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.1');
  api.use('check');
  api.use('underscore@1.0.8');
  api.use('accounts-password'); // For checking password
  api.use('barbatus:typescript@0.4.0');
  api.use('mdg:validated-method@1.1.0');
  api.use('aldeed:simple-schema@1.5.3');

  api.mainModule('client/index.ts', 'client');
  api.mainModule('server/index.ts', 'server');
});

Package.onTest(function(api) {
  api.use('metemq:metemq');

  api.use('barbatus:typescript@0.4.0');

  api.use([
    'practicalmeteor:mocha',
    'practicalmeteor:chai',
    'hwillson:stub-collections',
    'johanbrook:publication-collector'
  ]);

  api.mainModule('test/client/index.ts', 'client');
  api.mainModule('test/server/index.ts', 'server');
});
