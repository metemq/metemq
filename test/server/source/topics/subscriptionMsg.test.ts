import subscriptionMsg from '../../../../server/source/topics/subscriptionMsg';
import { INTERNAL_SERVER_ERROR } from '../../../../server/ddmq/ackCodes';

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
        source = new Source(`mqtt://localhost:${port}`);
        source.mqtt.once('connect', function() { done(); });
    });

    after(function(done) {
        source.mqtt.end(false, () => done());
    });

    // Close broker after tests
    after(function() {
        broker.close();
    });

    describe('Handler: subscriptionMsg', function() {
        const collectionName = 'test.subscriptionMsg';
        const collection = new Mongo.Collection(collectionName);
        const name = 'myPub';
        const fields = ['_id', 'name', 'value'];
        const thingId = 'myThing01';
        const payload = 'one,2,3.456';
        const params = ['one', 2, 3.456];


        // Reset collection
        before(function(done) {
            collection.remove({}, done);
        });

        // Publish test publication
        before(function() {
            source.publish(name, () => { return collection.find() }, fields);
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

        it('should send $added messages to the thing when a document is added', function(done) {
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/${name}/$added`);
                assert.equal(payload, `${documentId},,123`);
                done();
            });
            // Insert new document into test collection
            documentId = collection.insert({ 'value': 123 });
        });

        it('should send $changed messages to the thing when a document is changed', function(done) {
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/${name}/$changed`);
                assert.equal(payload, ',thingName,');
                done();
            });
            // Update document that inserted before
            collection.update({ _id: documentId }, { $set: { name: 'thingName' } });
        });

        it('should not send $changed message when a field not in user-defined fields is changed', function(done) {
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/${name}/$changed`);
                assert.equal(payload, ',,4321');
                done();
            });
            // Update document that inserted before
            collection.update({ _id: documentId }, { $set: { otherField: 'thingName' } });
            collection.update({ _id: documentId }, { $set: { value: 4321 } });
        })

        it('should send $removed messages to the thing when a document is removed', function(done) {
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/${name}/$removed`);
                assert.equal(payload, documentId);
                done();
            });
            // Update document that inserted before
            collection.remove({ _id: documentId });
        });

        describe('Publish handler', function() {
            it('should be executed in context of subscription', function(done) {
                let session = source.sessions[thingId];

                source.publish('context.test', function() {
                    let subscription = session.subscriptions['context.test'];

                    assert.equal(this, subscription);
                    assert.equal(this.thingId, thingId);
                    done();

                    return collection.find();
                }, ['_id']);

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
                }, ['_id']);

                subscriptionMsg('one,2,3.456', { thingId: thingId, name: 'param.test' }, source);
            });

            describe('Handler throwing error', function() {
                it('should send INTERNAL_SERVER_ERROR code when publish function throws error', function(done) {

                    source.publish('evilPub', function() {
                        throw new Error('Do not subscribe me!!!');
                    }, ['_id']);

                    source.mqtt.once('message', function(topic, message) {
                        let payload = message.toString();
                        assert.equal(topic, `${thingId}/$suback/evilPub`);
                        assert.equal(payload, INTERNAL_SERVER_ERROR);
                        done();
                    });

                    subscriptionMsg('', { thingId: thingId, name: 'evilPub' }, source);
                });

                it('should unregister subscription from session of the thing', function() {
                    let session = source.sessions[thingId];
                    let subscription = session.subscriptions['evilPub'];
                    assert.isUndefined(subscription);
                });
            });

            it('should throw error when return value is not a Cursor', function() {
                /* TODO */
            });
        });
    });
});
