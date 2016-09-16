import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { ThingsInbox } from 'meteor/metemq:metemq';

export class Source {
    /**
    * act(action: string, thingId: string[, ...args][, callback: (error, result)=>void])
    */
    act(action: string, thingId: string, ...args: any[]) {
        let callback = function(err, result) { }

        // Check callback function
        if (_.isFunction(_.last(args)))
            callback = args.pop();

        Meteor.call('/metemq/act', args, function(err, msgId) {
            if (err) {
                callback(err, null);
                return;
            }

            const handle = ThingsInbox.find({ _id: msgId })
                .observeChanges({
                    changed(id, fields) {
                        if (fields['state'] === 'done') {
                            const msg = ThingsInbox.findOne({ _id: msgId });
                            callback(null, msg.result);
                            handle.stop();
                        }
                    }
                });
        });
    }
}
