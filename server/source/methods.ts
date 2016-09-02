import { ThingInbox } from 'meteor/metemq:metemq';
import shortid = require('shortid');

export function act(context, params) {
    let action = params.action;
    let userId = params.userId;
    let thingId = params.thingId;
    let parameters = params.params;

    let msgId = shortid.generate;

    let obj = {
        _id: msgId,
        action: action,
        params: parameters,
        userId: userId,
        thingId: thingId,
        result: [],
        state: 'initial'
    }

    ThingInbox.insert(obj);

    return msgId;
}
