import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { ThingsInbox } from 'meteor/metemq:metemq';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const insertActionMsg = new ValidatedMethod({
    name: '/metemq/act',
    validate: null,
    run({ thingId, action, params }) {
        const msg = {
            _id: Random.id(8),
            action,
            thingId,
            params,
            userId: this.userId || null,
            state: 'initial'
        }

        return ThingsInbox.insert(msg);
    }
});

export const setActionDone = new ValidatedMethod({
    name: '/metemq/act/done',
    validate: null,
    run({ msgId }) {
        check(msgId, String);

        const msg = ThingsInbox.findOne(msgId);

        if (!msg) throw new Meteor.Error('/metemq/act/done:NO_SUCH_MESSAGE'
            , `There is no message whose _id is ${msgId}`);

        if (msg.userId !== this.userId)
            throw new Meteor.Error('/metemq/act/done:UNAUTHORIZED_USER'
                , `User ${this.userId} is not owner of this message`);

        return ThingsInbox.update(msgId, { $set: { state: 'done' } });
    }
});
