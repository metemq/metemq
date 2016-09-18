import StubCollections from 'meteor/hwillson:stub-collections';
import { assert } from 'meteor/practicalmeteor:chai';
import { Things, Thing, ThingsInbox } from 'meteor/metemq:metemq';

if (Meteor.isServer) {
    describe('class Thing', function() {
        let thingId = 'thing01';
        let thing: Thing;

        before(function() { StubCollections.stub(Things); });

        after(function() { StubCollections.restore(); });

        before(function() {
            Things.insert({ _id: thingId });
            thing = Things.findOne(thingId);
        });

        it('should be retrieved from "things" collection', function() {
            assert.instanceOf(thing, Thing);
            assert.equal(thing._id, thingId);
        });

        describe('#act', function() {
            it('should ...', function(done) {
                const action = 'my.action';
                thing.act(action, 'one', 2, function(err, result) {
                    console.log(result);
                    done();
                });

                ThingsInbox.update({ action }, { $set: { state: 'applied' } });
            });
        });
    });
}
