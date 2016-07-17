import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { Subscription } from '../subscription';
import {
    NO_SUCH_PUBLICATION_NAME,
    DUPLICATED_SUBSCRIPTION
} from '../../ddmq/ackCodes';
import { parseCSV } from '../../ddmq/util';

export default function subscriptionMsg(payload, params, source: Source) {
    let thingId: string = params.thingId;
    let name: string = params.name;

    // Check unknown publish name
    if (!_.has(source.publications, name)) {
        // Send $suback message with NO_SUCH_PUBLICATION_NAME error code
        source.send(`${thingId}/$suback/${name}`, NO_SUCH_PUBLICATION_NAME);
        return;
    }

    // Get publish handler of name
    let publication = source.publications[name];
    // Parse thing's comma-separated subscription parameters
    let pubParams = parseCSV(payload);
    // Get thing's session
    let session = source.getSession(thingId);
    /* TODO:
     * For now, just ignore if thing is already subscribing
     * publication that has same name.
     * But, maybe subscription parameters can be different.
     * In the future, we should handler this special case.
     */
    // Check thing is subscribing this publication already
    if (session.hasSubscription(name)) {
        session.send(`$suback/${name}`, DUPLICATED_SUBSCRIPTION);
        return;
    }
    // New subscription!
    let subscription = new Subscription(name, session, publication, pubParams);
    // Register subscription at session
    session.registerSubscription(subscription);
    // Start subscription
    subscription.start();
}
