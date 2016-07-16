import { assert } from 'meteor/practicalmeteor:chai';
import { Source } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';
import { createBroker } from '../../helpers/broker';

const Things = new Mongo.Collection('things');

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
            broker.once('clientConnected', function() { done(); });
        });
    });

    describe('#publish(name, handler, options?)', function() {
        let handler = function() {
            return Things.find();
        }

        it('should add publish handler whose key is its name, and value is handler', function() {
            source.publish('somePub', handler);

            assert.property(source.publishHandlers, 'somePub');
            assert.equal(handler, source.publishHandlers['somePub']);
        });

        it('should throws error, if there are duplicated publications', function() {
            assert.throws(function() {
                source.publish('somePub', function() { });
            });
        });

        describe('publishHandlers', function() {
            it('should return cursor', function() {
                let cursor = source.publishHandlers['somePub']();
                assert.property(cursor, '_cursorDescription');
            })
        })
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
