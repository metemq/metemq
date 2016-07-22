import { assert } from 'meteor/practicalmeteor:chai';
import { Source } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';
import { createBroker } from '../../helpers/broker';

describe('class Source', function() {
    let broker;
    let source: Source;
    let port: number;

    const collectionName = 'test.source.spec';
    const collection = new Mongo.Collection(collectionName);

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

    // Close broker after tests
    after(function() {
        broker.close();
    });

    describe('#constructor(brokerUrl, options)', function() {
        it('should connect to broker', function(done) {
            source = new Source(`mqtt://localhost:${port}`);
            source.mqtt.once('connect', function() { done(); });
        });
    });

    describe('#publish(name, handler, fields)', function() {
        let handler = function() {
            return collection.find();
        }

        it('should add publicatoin which has the handler', function() {
            source.publish('somePub', handler, ['_id']);

            assert.property(source.publications, 'somePub');
            assert.equal(source.publications['somePub'].handler, handler);
        });

        it('should throws error, if there are duplicated publications', function() {
            assert.throws(function() {
                source.publish('somePub', handler, ['_id']);
            });
        });

        it('should throws error, if name starts with $', function() {
            assert.throws(function() {
                source.publish('$nanana', () => { }, ['_id']);
            });
        });
    });

    describe('#methods(method)', function() {
        it('should register method handler', function() {
            source.methods({
                myMethod() {
                    collection.insert({ hi: 'hello!' });
                    return 'Hello, World!';
                }
            });

            assert.property(source.methodHandlers, 'myMethod');
        });
    });
});
