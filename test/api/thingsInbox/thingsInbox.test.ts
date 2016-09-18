import StubCollections from 'meteor/hwillson:stub-collections';
import { PublicationCollector } from 'meteor/johanbrook:publication-collector';
import { assert } from 'meteor/practicalmeteor:chai';
import { ThingsInbox } from 'meteor/metemq:metemq';
import { insertActionMsg } from 'meteor/metemq:metemq/api/thingsInbox/methods';

describe('things.inbox collection', function() {

    before(function() {
        StubCollections.stub(ThingsInbox);
    });

    after(function() {
        StubCollections.restore();
    });

    it('should ...', function() {

    });
});

if (Meteor.isServer) {
    describe('Publication "metemq.things.inbox"', function() {
        before(function() {
            ThingsInbox.remove({});
        });

        it('sends a message which its _id is msgId', function(done) {
            const thingId = 'thing01';
            const action = 'test.action';
            const params = ['one', 2, { three: 4 }];

            const msgId = insertActionMsg._execute({}, { thingId, action, params });

            const collector = new PublicationCollector();
            collector.collect('metemq.things.inbox', msgId, (collections) => {
                const msg = collections['things.inbox'][0];

                assert.equal(collections['things.inbox'].length, 1);
                assert.deepEqual(msg, {
                    _id: msgId,
                    userId: null,
                    state: 'initial',
                    thingId,
                    action,
                    params
                })

                done();
            });
        });
    });
}
