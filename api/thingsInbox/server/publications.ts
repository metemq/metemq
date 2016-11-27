import { ThingsInbox } from 'meteor/metemq:metemq';
import { check } from 'meteor/check';

Meteor.publish('metemq.things.inbox', function(msgId) {
  check(msgId, String);

  const selector = {
    _id: msgId,
    userId: this.userId || null,
    state: { $in: ['initial', 'pending', 'applied'] }
  }

  return ThingsInbox.find(selector);
});
