import { ThingsInbox } from 'meteor/metemq:metemq';
import shortid = require('shortid');

export function act(action: string, thingId: string, ...params: any[]): string {
    const msgId = shortid.generate();

    const msg = {
        _id: msgId,
        action: action,
        params: params,
        userId: this.userId || null,
        thingId: thingId,
        // result: [],
        state: 'initial'
    }

    ThingsInbox.insert(msg);

    return msgId;
}

export function pending(msgId: string, thingId: string, progress: number): string {
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

    ThingsInbox.update({ _id: msgId }, { $set: { progress: progress, state: 'pending' } });

    return 'done';
}

export function applied(msgId: string, thingId: string, result?): string {
    if (thingId !== this.thingId) {
        return 'reject';
    }

    ThingsInbox.update({ _id: msgId }, { $set: { progress: 100, state: 'applied', result: result } });

    return 'done';
}

export function rejected(msgId: string, thingId: string): string {
    if (thingId !== this.thingId) {
        return 'reject';
    }

    ThingsInbox.update({ _id: msgId }, { $set: { state: 'rejected' } });

    return 'done';
}
