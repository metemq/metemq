import { assert } from 'meteor/practicalmeteor:chai';
import { Source } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';
import * as portfinder from 'portfinder';
import { createBroker } from '../../helpers/broker';

const Things = new Mongo.Collection('things');

describe('class Source', function() {
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
});
