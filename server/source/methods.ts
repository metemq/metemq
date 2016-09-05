import { ThingsInbox } from 'meteor/metemq:metemq';
import shortid = require('shortid');

export function act(action, userId, thingId, params) {
    let msgId = shortid.generate();

    let obj = {
        _id: msgId,
        action: action,
        params: params,
        userId: userId,
        thingId: thingId,
        result: [],
        state: 'initial'
    }

    ThingsInbox.insert(obj);

    return msgId;
}

export function pending(msgId, thingId, progress) {
    if (thingId !== this.thingId) {
        return 'reject';
    }

    if (typeof progress === 'string') {
        progress = Number(progress);
    } else if (typeof progress !== 'number') {
        return 'reject'
    }

    if (progress < 0 || progress >= 100) {
        return 'reject';
    }

    ThingsInbox.update({ _id: thingId }, { $set: { progress: progress, state: 'pending' } });

    return 'done';
}

export function applied(msgId, thingId) {
    if (thingId !== this.thingId) {
        return 'reject';
    }

    ThingsInbox.update({ _id: thingId }, { $set: { progress: 100, state: 'applied' } });

    return 'done';
}

export function rejected(msgId, thingId) {
    if (thingId !== this.thingId) {
        return 'reject';
    }

    ThingsInbox.update({ _id: msgId }, { $set: { state: 'rejected' } });

    return 'done';
}
