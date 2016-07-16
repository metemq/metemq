import thingDisconnect from '../../../../server/source/topics/thingDisconnect';
import subscriptionMsg from '../../../../server/source/topics/subscriptionMsg';

import * as portfinder from 'portfinder';
import { Source } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';
import { assert } from 'meteor/practicalmeteor:chai';
import { createBroker } from '../../../helpers/broker';


describe('Topic [+thingId/$disconnect]', function() {
    let broker;
    let source: Source;
    let port: number;

    // Wait for source to connect to broker
    this.timeout(10000);

    // Find free port automatically
    before(function(done) {
        portfinder.getPort(function(err, freePort) {
            if (err) throw err;
            port = freePort;
            done();
        });
    });

    // Create broker before tests
    before(function(done) {
        broker = createBroker({ port: port }, function() { done(); });
        broker.on('published', function(packet, client) {
            console.log(`[${packet.topic}]->${packet.payload.toString()}`);
        });
    });

    before(function(done) {
        source = new Source(`mqtt://localhost:${port}`);
        broker.once('clientConnected', function() { done(); });
    });

    // Close broker after tests
    after(function() {
        broker.close();
    });

    describe('Handler: thingDisconnect', function() {
        const collectionName = 'test.thingDisconnect';
        const collection = new Mongo.Collection(collectionName);

        const thing1 = { thingId: 'thing01' };
        const thing2 = { thingId: 'thing02' };

        // Reset collection
        before(function(done) {
            collection.remove({}, done);
        });

        // Publish test publication
        before(function() {
            source.publish('aPub', function() {
                return collection.find();
            });
        });

        before(function() {
            subscriptionMsg('', { thingId: thing1.thingId, name: 'aPub' }, source);
            subscriptionMsg('', { thingId: thing2.thingId, name: 'aPub' }, source);
        });

        it('should only remove the disconnected thing from sessions', function() {
            thingDisconnect('', { thingId: thing2.thingId }, source);

            assert.notProperty(source.sessions, thing2.thingId);
            assert.property(source.sessions, thing1.thingId);
        });

        it('should empty sessions, when everything is disconnected', function() {
            thingDisconnect('', { thingId: thing1.thingId }, source);

            assert.lengthOf(_.values(source.sessions), 0);
        });
    });
});