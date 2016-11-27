import thingConnect from '../../../../server/source/topics/thingConnect';
import dataBinding from '../../../../server/source/topics/dataBinding';

import { Source, Things } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';
import { assert } from 'meteor/practicalmeteor:chai';
import { createBroker } from '../../../helpers/broker';


describe('Topic [+thingId/$bind/+field]', function() {
  let broker;
  let source: Source;
  let port: number;

  // Wait for source to connect to broker
  this.timeout(10000);

  // Create broker before tests
  before(function(done) {
    createBroker((b) => {
      broker = b;
      port = broker.opts.port;
      // Print log
      broker.on('published', function(packet, client) {
        console.log(`[${packet.topic}]->${packet.payload.toString()}`);
      });

      done();
    });
  });

  before(function(done) {
    source = new Source({ brokerUrl: `mqtt://localhost:${port}` });
    source.mqtt.once('connect', function() { done(); });
  });

  // Close broker after tests
  after(function() {
    source.close();
    broker.close();
  });

  describe('Handler: dataBinding', function() {
    const collectionName = 'test.dataBinding';
    const collection = new Mongo.Collection(collectionName);

    const thingId = 'myThing01';
    const username = 'jun940204';
    const password = 'mysecret1234!';

    // Reset collection
    before(function(done) {
      collection.remove({}, done);
    });

    // Reset users & things collections
    before(function() {
      Meteor.users.remove({});
      Things.remove({});
    });

    // Create user, and connect thing
    before(function() {
      Accounts.createUser({ username: username, password: password });

      const payload = JSON.stringify({
        username: username,
        password: password
      });
      const params = {
        thingId: thingId,
        msgId: 'connectMe'
      };
      thingConnect(payload, params, source);
    });

    it('should bind number', function() {
      const field = 'numValue';
      const params = {
        thingId: thingId,
        field: field
      };
      const payload = '1234';

      dataBinding(payload, params, source);

      const thing = Things.findOne({ _id: thingId });
      assert.strictEqual(thing[field], 1234);
    });

    it('should bind string', function() {
      const field = 'stringValue';
      const params = {
        thingId: thingId,
        field: field
      };
      const payload = '"abcd"';

      dataBinding(payload, params, source);

      const thing = Things.findOne({ _id: thingId });
      assert.strictEqual(thing[field], 'abcd');
    });

    it('should bind Array<number|string>', function() {
      const field = 'arrValue';
      const params = {
        thingId: thingId,
        field: field
      };
      const payload = '["abcd",1234,4.321]';

      dataBinding(payload, params, source);

      const thing = Things.findOne({ _id: thingId });
      assert.isArray(thing[field]);
      assert.deepEqual(thing[field], ['abcd', 1234, 4.321]);
    });
  });
});
