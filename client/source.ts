import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { ThingsInbox } from 'meteor/metemq:metemq';

export class Source {

    constructor() {
        /* TODO: Subscribe things, things.inbox */
    }

    /**
    * act(action: string, thingId: string[, ...args][, callback: (error, result)=>void])
    */
    act(action: string, thingId: string, ...args: any[]) {
        /* TODO */
    }
}
