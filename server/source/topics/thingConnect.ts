import { _ } from 'meteor/underscore';
import { Source } from '../source';

export default function thingConnect(payload, params, source: Source) {
    let thingId: string = params.thingId;
    let msgId: string = params.msgId;

    const parsed = JSON.parse(payload);
    const userId: string | undefined = parsed.userId;
    const password: string | undefined = parsed.password;

    // If there is already existing session
    if (_.has(source.sessions, thingId)) { /* TODO */ }

    /* TODO:
     * If there are username & password both, server check password and allow.
     * Else if there is only username or not, run user-defined allow function.
     * Else if there is no user-defined allow function, allow connection.
     */

     /* XXX Allow every connection for now */
    source.send(`${thingId}/$connack/${msgId}`, 'true');
}
