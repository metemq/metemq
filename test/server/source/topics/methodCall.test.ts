import methodCall from '../../../../server/source/topics/methodCall';
import { CALLACK } from '../../../../server/ddmq/ackCodes';

import { Source } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';
import { assert } from 'meteor/practicalmeteor:chai';
import { createBroker } from '../../../helpers/broker';
import { doneWhen } from '../../../helpers/doneWhen';

describe('Topic [+thingId/$call/+method/+msgId]', function() {
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

    after(function(done) {
        source.mqtt.end(false, () => done());
    });

    // Close broker after tests
    after(function() {
        broker.close();
    });

    describe('Handler: methodCall', function() {
        const collectionName = 'test.methodCall';
        const collection = new Mongo.Collection(collectionName);

        // Reset collection
        before(function(done) {
            collection.remove({}, done);
        });

        afterEach(function(done) {
            doneWhen('clear', source, done);
            source.mqtt.publish('clear', 'clear');
        });

        it('should send $callack message with code SESSION_NOT_FOUND if there is no session for the thing', function(done) {
            const thingId = 'unkownThing';
            const msgId = 'msg0101';

            source.methods({
                'pureMethod': function() { }
            });

            const params = {
                thingId: thingId,
                method: 'pureMethod',
                msgId: msgId
            };
            methodCall('', params, source);

            source.mqtt.once('message', function(topic, message) {
                assert.equal(`${thingId}/$callack/${msgId}/${CALLACK.SESSION_NOT_FOUND}`, topic);
                done();
            });
        });

        it('should send $callack message with code NO_SUCH_METHOD', function(done) {
            const thingId = 't01';
            const msgId = 'm01';
            const params = {
                thingId: thingId,
                method: 'undefinedMethod',
                msgId: msgId
            };

            source.createSession(thingId);

            methodCall('', params, source);

            source.mqtt.once('message', function(topic, message) {
                assert.equal(`${thingId}/$callack/${msgId}/${CALLACK.NO_SUCH_METHOD}`, topic);
                done();
            });
        });

        it('should send $callack message with code METHOD_EXCEPTION', function(done) {
            const thingId = 'lambThing';
            const msgId = 'uselessMsg';

            source.createSession(thingId);

            source.methods({
                'evilMethod': function() {
                    throw new Error('do not call me!');
                }
            });

            const params = {
                thingId: thingId,
                method: 'evilMethod',
                msgId: msgId
            };
            methodCall('', params, source);

            source.mqtt.once('message', function(topic, message) {
                assert.equal(`${thingId}/$callack/${msgId}/${CALLACK.METHOD_EXCEPTION}`, topic);
                done();
            });
        });

        it('should check types of return values', function() {
            const thingId = 'aThing';
            const msgId = 'm02';

            source.createSession(thingId);

            source.methods({
                'returnObject': () => { return { name: 'Handle me!' } },
                'returnFunction': () => { return () => console.log('Hi~') },
                'returnIllegalArray': () => { return ['one', 2, {}] },
                'returnNothing': () => { },
                'returnUndefined': () => { return undefined },
                'returnNull': () => { return null },
                'returnString': () => { return 'one' },
                'returnNumber': () => { return 1234 },
                'returnStringArray': () => { return ['one', 'two', 'three'] },
                'returnNumberArray': () => { return [1, 2, 3.456] },
                'returnMixedArray': () => { return ['one', 2, 3.456] }
            });

            let params = {
                thingId: thingId,
                msgId: msgId
            };
            // Illegal method usages
            params['method'] = 'returnObject';
            assert.throws(() => methodCall('', params, source));
            params['method'] = 'returnFunction';
            assert.throws(() => methodCall('', params, source));
            params['method'] = 'returnIllegalArray';
            assert.throws(() => methodCall('', params, source));
            // Legal method usages
            params['method'] = 'returnNothing';
            assert.doesNotThrow(() => methodCall('', params, source));
            params['method'] = 'returnUndefined';
            assert.doesNotThrow(() => methodCall('', params, source));
            params['method'] = 'returnNull';
            assert.doesNotThrow(() => methodCall('', params, source));
            params['method'] = 'returnString';
            assert.doesNotThrow(() => methodCall('', params, source));
            params['method'] = 'returnNumber';
            assert.doesNotThrow(() => methodCall('', params, source));
            params['method'] = 'returnStringArray';
            assert.doesNotThrow(() => methodCall('', params, source));
            params['method'] = 'returnNumberArray';
            assert.doesNotThrow(() => methodCall('', params, source));
            params['method'] = 'returnMixedArray';
            assert.doesNotThrow(() => methodCall('', params, source));
        });

        it('should be able to deal with DB', function(done) {
            let params = {
                thingId: 'dbThing'
            };
            const docId = 'doc01';

            source.createSession(params.thingId);

            source.methods({
                'insert': (value) => {
                    collection.insert({ _id: docId, value: value });
                },
                'update': (value) => {
                    collection.update({ _id: docId }, { $set: { value: value } });
                },
                'remove': () => {
                    collection.remove({ _id: docId });
                }
            });

            params['method'] = params['msgId'] = 'insert';
            methodCall('1234', params, source);
            assert.equal(collection.find({ _id: docId }).count(), 1);

            params['method'] = params['msgId'] = 'update';
            methodCall('4321', params, source);
            assert.equal(collection.findOne({ _id: docId })['value'], 4321);

            params['method'] = params['msgId'] = 'remove';
            methodCall('', params, source);
            assert.equal(collection.find({ _id: docId }).count(), 0);

            doneWhen('dbThing/$callack/remove/0', source, done);
        });

        it('should send $callack message with string return value', function(done) {
            const thingId = 'giveMeResult';
            const params = { thingId: thingId };

            source.createSession(thingId);

            params['msgId'] = '1';
            params['method'] = 'returnString';
            methodCall('', params, source);
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/$callack/1/0`);
                assert.strictEqual(payload, 'one');
                done();
            });
        });

        it('should send $callack message with number return value', function(done) {
            const thingId = 'giveMeResult';
            const params = { thingId: thingId };

            params['msgId'] = '2';
            params['method'] = 'returnNumber';
            methodCall('', params, source);
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/$callack/2/0`);
                assert.strictEqual(payload, '1234');
                done();
            });
        });

        it('should send $callack message with string[] return value', function(done) {
            const thingId = 'giveMeResult';
            const params = { thingId: thingId };

            params['msgId'] = '3';
            params['method'] = 'returnStringArray';
            methodCall('', params, source);
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/$callack/3/0`);
                assert.strictEqual(payload, 'one,two,three');
                done();
            });
        });

        it('should send $callack message with number[] return value', function(done) {
            const thingId = 'giveMeResult';
            const params = { thingId: thingId };

            params['msgId'] = '4';
            params['method'] = 'returnNumberArray';
            methodCall('', params, source);
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/$callack/4/0`);
                assert.strictEqual(payload, '1,2,3.456');
                done();
            });
        });

        it('should send $callack message with Array<string|number> return value', function(done) {
            const thingId = 'giveMeResult';
            const params = { thingId: thingId };

            params['msgId'] = '5';
            params['method'] = 'returnMixedArray';
            methodCall('', params, source);
            source.mqtt.once('message', function(topic, message) {
                let payload = message.toString();
                assert.equal(topic, `${thingId}/$callack/5/0`);
                assert.strictEqual(payload, 'one,2,3.456');
                done();
            });
        });
    });
});
