import { insertActionMsg, setActionDone } from './thingsInbox/methods';
import { ThingsInbox } from 'meteor/metemq:metemq';

export class Thing {
    _id: string;
    _owner: string;		// userId
    [fields: string]: any;

    constructor(thingDocument) {
        _.extend(this, thingDocument);
    }

    act(action: string, ...args: any[]) {
        let callback = function(err, result) { }

        // Check callback function
        if (_.isFunction(_.last(args)))
            callback = args.pop();

        const params = args;
        const thingId = this._id;

        insertActionMsg.call({ action, thingId, params }, (error, msgId) => {
            if (error) return callback(new Error('There was an error while inserting action message'), null);

            let sub;

            if (Meteor.isClient)
                sub = Meteor.subscribe('metemq.things.inbox', msgId);

            const handle = ThingsInbox.find(msgId).observe({
                changed(msg: any) {
                    const state = msg.state;
                    if (state === 'pending') {
                        console.log(`${msgId} pending...`);
                    } else if (state === 'applied') {
                        setActionDone.call({ msgId }, function(err, result) {
                            callback(null, msg.result);

                            handle.stop();
                            if (Meteor.isClient)
                                sub.stop();
                        });
                    }
                }
            })
        });
    }
}
