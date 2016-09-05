import thingConnect from '../../../../server/source/topics/thingConnect';
import { CONNACK } from '../../../../server/ddmq/ackCodes';

import { Source, Things } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';
import { assert } from 'meteor/practicalmeteor:chai';
import { createBroker } from '../../../helpers/broker';


describe('Topic [+thingId/$connect/+msgId]', function() {
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

    after(function() {
        source.close();
    });

    // Close broker after tests
    after(function() {
        broker.close();
    });

    describe('Handler: thingDisconnect', function() {
        const collectionName = 'test.thingConnect';
        const collection = new Mongo.Collection(collectionName);

        const thingId = 'myThing01';
        const username = 'jun940204';
        const password = 'mysecret1234!';
        const msgId = 'abcd';

        // Reset collection
        before(function(done) {
            collection.remove({}, done);
        });

        before(function() {
            Meteor.users.remove({});
            Things.remove({});
            Accounts.createUser({ username: username, password: password });
        });

        it('should send $connack message', function(done) {
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/$connack/${msgId}`);
                assert.equal(payload, CONNACK.OK);
                done();
            });

            const payload = JSON.stringify({
                username: username,
                password: password
            });
            const params = {
                thingId: thingId,
                msgId: msgId
            };
            thingConnect(payload, params, source);
        });

        it('should insert new document of the thing', function() {
            assert.equal(Things.find({ _id: thingId }).count(), 1);
        });

        it('should create session for the thing', function() {
            assert.property(source.sessions, thingId);
        });

        it('should send $connack message with WRONG_PASSWORD code if password is wrong', function(done) {
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/$connack/${msgId}`);
                assert.equal(payload, CONNACK.WRONG_PASSWORD);
                done();
            });

            const payload = JSON.stringify({
                username: username,
                password: 'wrongPassword'
            });
            const params = {
                thingId: thingId,
                msgId: msgId
            };
            thingConnect(payload, params, source);
        });

        it('should send $connack message with NO_SUCH_USER code if there is no such username', function(done) {
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, 'ghostThing/$connack/ghostMsg01');
                assert.equal(payload, CONNACK.NO_SUCH_USER);
                done();
            });

            const payload = JSON.stringify({
                username: 'ghostUser',
                password: 'imghooooost'
            });
            const params = {
                thingId: 'ghostThing',
                msgId: 'ghostMsg01'
            };
            thingConnect(payload, params, source);
        });
    });
});
