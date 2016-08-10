Package.describe({
  name: 'metemq:metemq',
  version: '0.3.1',
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
  'mosca': '2.0.2',    // For testing
  'portfinder': '1.0.3',
  'metemq-broker': '0.0.1'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4');
  api.use('underscore@1.0.8');
  api.use('accounts-password'); // For checking password
  api.use('barbatus:typescript@0.4.0');

  api.mainModule('client/index.ts', 'client');
  api.mainModule('server/index.ts', 'server');
});

Package.onTest(function(api) {
  api.use('metemq:metemq');

  api.use('barbatus:typescript@0.4.0');

  api.use(['practicalmeteor:mocha', 'practicalmeteor:chai']);

  api.mainModule('test/index.ts');
});
