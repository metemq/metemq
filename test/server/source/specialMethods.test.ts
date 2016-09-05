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

    describe('#/metemq/act', function() {
        let params = "on,t01,u01,[]";
        let msgId;

        before(function() {
            method = '_metemq_act';
            source.mqtt.publish(`${thingId}/$call/${method}/11`, params);

            source.mqtt.once('message', function(topic, message) {
                msgId = message.toString();

                console.log(msgId);
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
});
