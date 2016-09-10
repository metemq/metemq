import { assert } from 'meteor/practicalmeteor:chai';
import { Source, ThingsInbox } from 'meteor/metemq:metemq';
import { createBroker } from '../../helpers/broker';
import methodCall from '../../../server/source/topics/methodCall';


describe('Special Methods', function() {
    let broker;
    let source: Source;
    let port: number;
    let method: string;
    let thingId: string;
    let wrongThingId: string;
    let msgId;

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

    before(function(done) {
        thingId = 't01';
        wrongThingId = 't02';

        source.createSession(thingId);
        source.createSession(wrongThingId);

        done();
    })

    // Close broker after tests
    after(function() {
        broker.close();
    });

    describe('Method: _metemq_act', function() {
        let params = "on,t01,u01,[]";

        before(function() {
            let obj = {
                thingId: "t01",
                method: '_metemq_act',
                msgId: '11'
            }
            methodCall(params, obj, source);

            source.mqtt.once('message', function(topic, message) {
                msgId = message.toString();
            })
        })

        it('should act method is called, message is inserted to Things.inbox collection', function(done) {
            let doc = ThingsInbox.findOne({ _id: msgId });

            assert.equal('on', doc.action);
            assert.equal('t01', doc.thingId);
            assert.equal('u01', doc.userId);
            assert.equal('initial', doc.state);

            done();
        });
    });

    describe('Method: _metemq_pending', function() {
        let msg;

        beforeEach(function() {
            source.mqtt.once('message', function(topic, message) {
                msg = message.toString();
            })
        })

        it('Should pending method is called with correct syntex, doc is updated to recieved info', function(done) {
            let params = `${msgId},${thingId},50`;
            let obj = {
                thingId: thingId,
                method: '_metemq_pending',
                msgId: '12'
            }
            methodCall(params, obj, source);

            let doc = ThingsInbox.findOne({ _id: msgId });

            let interval = setInterval(function() {
                assert.equal('done', msg);
                assert.equal('pending', doc.state);
                assert.equal(50, doc.progress);

                done();

                clearInterval(interval);
            }, 1000);
        })

        it('Should pending method is called with uncorrect syntex, called method is rejected', function(done) {
            let params = `${msgId},${thingId},200`;
            let obj = {
                thingId: thingId,
                method: '_metemq_pending',
                msgId: '13'
            }
            methodCall(params, obj, source);


            let interval = setInterval(function() {
                assert.equal('reject', msg);

                done();
                msg = undefined;

                clearInterval(interval);
            }, 1000);
        })

        it('Should pending method is called with mismatch thingId, called method is rejected', function(done) {
            let params = `${msgId},${wrongThingId},50`;
            let obj = {
                thingId: thingId,
                method: '_metemq_pending',
                msgId: '14'
            }
            methodCall(params, obj, source);

            let interval = setInterval(function() {
                assert.equal('reject', msg);

                done();

                clearInterval(interval);
            }, 1000);
        })
    })

    describe('Method: _metemq_applied', function() {
        let msg;

        beforeEach(function() {
            source.mqtt.once('message', function(topic, message) {
                msg = message.toString();
            })
        })

        it('Should applied method is called, state is updated to applied', function(done) {
            let params = `${msgId},${thingId}`;
            let obj = {
                thingId: thingId,
                method: '_metemq_applied',
                msgId: '15'
            }
            methodCall(params, obj, source);

            let doc = ThingsInbox.findOne({ _id: msgId });

            let interval = setInterval(function() {
                assert.equal('done', msg);
                assert.equal('applied', doc.state);

                done();

                clearInterval(interval);
            }, 1000);
        })

        it('Should applied method is called with mismatch thingId, called method is rejected', function(done) {
            let params = `${msgId},${wrongThingId}`;
            let obj = {
                thingId: thingId,
                method: '_metemq_applied',
                msgId: '16'
            }
            methodCall(params, obj, source);

            let interval = setInterval(function() {
                assert.equal('reject', msg);

                done();

                clearInterval(interval);
            }, 1000);
        })
    })
    describe('Method: _metemq_rejected', function() {
        let msg;

        beforeEach(function() {
            source.mqtt.once('message', function(topic, message) {
                msg = message.toString();
            })
        })

        it('Should rejected method is called, state is updated to rejected', function(done) {
            let params = `${msgId},${thingId}`;
            let obj = {
                thingId: thingId,
                method: '_metemq_rejected',
                msgId: '17'
            }
            methodCall(params, obj, source);

            let doc = ThingsInbox.findOne({ _id: msgId });

            let interval = setInterval(function() {
                assert.equal('done', msg);
                assert.equal('rejected', doc.state);

                done();

                clearInterval(interval);
            }, 1000);
        })

        it('Should rejected method is called with mismatch thingId, called method is rejected', function(done) {
            let params = `${msgId},${wrongThingId}`;
            let obj = {
                thingId: thingId,
                method: '_metemq_rejected',
                msgId: '18'
            }
            methodCall(params, obj, source);

            let interval = setInterval(function() {
                assert.equal('reject', msg);

                done();

                clearInterval(interval);
            }, 1000);
        })
    })
});
