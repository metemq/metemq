import StubCollections from 'meteor/hwillson:stub-collections';
import { assert } from 'meteor/practicalmeteor:chai';
import { Things, Thing, ThingsInbox } from 'meteor/metemq:metemq';


describe('class Thing', function() {
  let thingId = 'thing01';
  let thing: Thing;

  before(function() { StubCollections.stub([Things, ThingsInbox]); });

  after(function() { StubCollections.restore(); });

  before(function() {
    Things.insert({ _id: thingId });
    thing = Things.findOne(thingId);
  });

  it('should be retrieved from "things" collection', function() {
    assert.instanceOf(thing, Thing);
    assert.equal(thing._id, thingId);
  });

  if (Meteor.isServer) {
    describe('#act', function() {
      it('should be done', function(done) {
        const action = 'my.action';
        thing.act(action, 'one', 2, function(err, result) {
          const msg = ThingsInbox.findOne({ action });
          assert.equal(msg.state, 'done');
          done();
        });

        ThingsInbox.update({ action }, { $set: { state: 'applied' } });
      });
    });
  }
});
