import { insertActionMsg } from 'meteor/metemq:metemq/api/thingsInbox/methods';
import { assert } from 'meteor/practicalmeteor:chai';
import { ThingsInbox } from 'meteor/metemq:metemq';


if (Meteor.isServer) {
  describe('things.inbox methods', function() {

    describe('insertActionMsg', function() {
      it('should insert an action message', function() {
        const thingId = 'thing01';
        const action = 'test.action';
        const params = ['one', 2, { three: 4 }];

        const msgId = insertActionMsg._execute({}, { thingId, action, params });
        const msg = ThingsInbox.findOne(msgId);

        assert.isString(msgId);
        assert.equal(msg._id, msgId);
        assert.equal(msg.thingId, thingId);
        assert.equal(msg.action, action);
        assert.deepEqual(msg.params, params);
      });
    });
  });
}
