import StubCollections from 'meteor/hwillson:stub-collections';
import { assert } from 'meteor/practicalmeteor:chai';
import { Things, Thing } from 'meteor/metemq:metemq';

describe('things collection', function() {

  before(function() {
    StubCollections.stub(Things);
  });

  after(function() {
    StubCollections.restore();
  });

  it('should transform document into an instance of Thing', function() {
    const thingId = 'thing01';
    Things.insert({ _id: thingId });

    const thing = Things.findOne(thingId);

    assert.instanceOf(thing, Thing);
    assert.equal(thing._id, thingId);
  });
});

if (Meteor.isServer) {
  describe('Publication of "things" collection', function() {

  });
}
