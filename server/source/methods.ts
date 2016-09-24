import { ThingsInbox } from 'meteor/metemq:metemq';


export function pending(msgId: string, progress: number): string {
    if (!isThingMsgOwner(msgId, this.thingId)) return 'reject';

    progress = Number(progress);

    if (isNaN(progress) || progress < 0 || progress >= 100) return 'reject';

    ThingsInbox.update({ _id: msgId }, { $set: { progress: progress, state: 'pending' } });

    return 'done';
}

export function applied(msgId: string, ...result): string {
    if (!isThingMsgOwner(msgId, this.thingId)) return 'reject';

    ThingsInbox.update({ _id: msgId }, { $set: { progress: 100, state: 'applied', result } });

    return 'done';
}

export function rejected(msgId: string): string {
    if (!isThingMsgOwner(msgId, this.thingId)) return 'reject';

    ThingsInbox.update({ _id: msgId }, { $set: { state: 'rejected' } });

    return 'done';
}

function isThingMsgOwner(msgId: string, thingId: string): boolean {
    const msg = ThingsInbox.findOne(msgId);
    return msg.thingId === thingId;
}
