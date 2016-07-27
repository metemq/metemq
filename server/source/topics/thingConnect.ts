import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { Things } from '../../things';

export default function thingConnect(payload, params, source: Source) {
    const thingId: string = params.thingId;
    const msgId: string = params.msgId;

    const parsed = JSON.parse(payload);
    const username: string | undefined = parsed.username;
    const password: string | undefined = parsed.password;

    // If there is already existing session
    if (source.hasSession(thingId)) { /* TODO */ }

    // Check password if there is username
    if (username && password && !checkPassword(username, password))
        return sendConnack(false);

    /* TODO: isAllowed? If return value of user-defined allow function is false,
     * Stop here and send $connack false.
     */

     // If there is no document of the thing, it's new thing!
    if (Things.find({ _id: thingId }).count() === 0)
        Things.insert({ _id: thingId });

    // Create session for the thing
    source.createSession(thingId);

    // Send $connack message with true
    sendConnack(true);

    function sendConnack(allow: boolean) {
        source.send(`${thingId}/$connack/${msgId}`, allow);
    }
}

// Check password for username is right
function checkPassword(username, password): boolean {
    // Get user document
    let user = Meteor.users.findOne({ username: username });
    // Return false, if user does not exist
    if (!user) return false;
    // Check password
    let result = Accounts._checkPassword(user, password);
    // Return false if there is error, else true
    return !result.error;
}
