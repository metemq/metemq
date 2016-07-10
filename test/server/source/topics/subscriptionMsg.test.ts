import subscriptionMsg from '../../../../server/source/topics/subscriptionMsg';

import * as portfinder from 'portfinder';
import { Source } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';
import { assert } from 'meteor/practicalmeteor:chai';
import { createBroker } from '../../../helpers/broker';

describe('Topic [+thingId/$sub/+name]', function() {
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

    describe('Handler: subscriptionMsg', function() {
        const name = 'myPub';
        const thingId = 'myThing01';
        const payload = 'one,2,3.456';
        const params = ['one', 2, 3.456];
        const collectionName = 'test';
        const collection = new Mongo.Collection(collectionName);

        // Reset collection
        before(function(done) {
            collection.remove({}, done);
        });

        // Publish test publication
        before(function() {
            source.publish(name, function() {
                return collection.find();
            });
        });

        before(function() {
            subscriptionMsg(payload, { thingId: thingId, name: name }, source);
        });

        it('should register new session of the thing', function() {
            assert.property(source.sessions, thingId);
        });

        it('should register new subscription at the session', function() {
            let session = source.sessions[thingId];
            assert.property(session.subscriptions, name);
        });

        it('takes payload as subscription parameters', function() {
            let session = source.sessions[thingId];
            let subscription = session.subscriptions[name];
            assert.deepEqual(subscription.params, params);
        });

        let documentId;

        it('should send added messages to the thing when a document is added', function(done) {
            broker.once('published', function(packet, client) {
                let topic = packet.topic;
                let payload = packet.payload.toString();
                assert.equal(topic, `${thingId}/${name}/${collectionName}/${documentId}/added/value`);
                assert.strictEqual(payload, '123');
                done();
            });
            // Insert new document into test collection
            documentId = collection.insert({ 'value': 123 });
        });

        it('should send changed messages to the thing when a document is changed', function(done) {
            broker.once('published', function(packet, client) {
                let topic = packet.topic;
                let payload = packet.payload.toString();
                assert.equal(topic, `${thingId}/${name}/${collectionName}/${documentId}/changed/value`);
                assert.strictEqual(payload, 'update');
                done();
            });
            // Update document that inserted before
            collection.update({ _id: documentId }, { $set: { value: 'update' } });
        });

        it('should send removed messages to the thing when a document is removed', function(done) {
            broker.once('published', function(packet, client) {
                let topic = packet.topic;
                let payload = packet.payload.toString();
                assert.equal(topic, `${thingId}/${name}/${collectionName}/${documentId}/removed`);
                assert.strictEqual(payload, '');
                done();
            });
            // Update document that inserted before
            collection.remove({ _id: documentId });
        });

        describe('publish handler', function() {
            it('should be executed in context of subscription', function(done) {
                let session = source.sessions[thingId];

                source.publish('context.test', function() {
                    let subscription = session.subscriptions['context.test'];
                    
                    assert.equal(this, subscription);
                    assert.equal(this.thingId, thingId);
                    done();
                    return collection.find();
                });

                subscriptionMsg('', { thingId: thingId, name: 'context.test' }, source);
            });

            it('should receive parameters as arguments', function(done) {
                let session = source.sessions[thingId];

                source.publish('param.test', function(one, two, three) {
                    let subscription = session.subscriptions['param.test'];

                    assert.equal(this, subscription);
                    assert.equal(this.thingId, thingId);

                    assert.strictEqual(one, 'one');
                    assert.strictEqual(two, 2);
                    assert.strictEqual(three, 3.456);
                    done();
                    return collection.find();
                });

                subscriptionMsg('one,2,3.456', { thingId: thingId, name: 'param.test' }, source);
            });

            it('should throw error when return value is not a Cursor', function() {
                /* TODO */
            });
        });
    });
});
