import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { Subscription } from '../subscription';
import { SUBACK } from '../../ddmq/ackCodes';
import { parseCSV } from '../../ddmq/util';

export default function subscriptionMsg(payload, params, source: Source) {
    let thingId: string = params.thingId;
    let name: string = params.name;

    // Check unknown publish name
    if (!_.has(source.publications, name)) {
        // Send $suback message with NO_SUCH_PUBLICATION_NAME error code
        source.send(`${thingId}/$suback/${name}`, SUBACK.NO_SUCH_PUBLICATION_NAME);
        return;
    }

    // Get publish handler of name
    let publication = source.publications[name];
    // Parse thing's comma-separated subscription parameters
    let pubParams = parseCSV(payload);
    // Get thing's session
    let session = source.getSession(thingId);

    // Check thing is subscribing this publication already
    if (session.hasSubscription(name)) {
        let sub = session.getSubscription(name);
        let param = sub.getParams();

        for (let parameter of params) {
            // Check the already subscription is subscribing to evething
            if (parameter === '#') {
                session.send(`$suback/${name}`, SUBACK.DUPLICATED_SUBSCRIPTION);
                return;
            } else {
                //Check the parameter equal already parameter
                for (let pubParam of pubParams) {
                    if (pubParam === parameter) {
                        session.send(`$suback/${name}`, SUBACK.
                          DUPLICATED_SUBSCRIPTION);
                        return;
                    }
                }
            }
        }

        // Add parameters
        for (let pubParam of pubParams) {
            // if parameter is '#', another parameters have to be removed
            if (pubParam === '#') {
                param = null;
                param.push('#');

                break;
            }

            param.push(pubParam);
        }

        //Stop the already subscription
        sub.stop();

        let subscription = new Subscription(name, session, publication, param);
        // Replace subscription at session
        session.replaceSubscription(subscription);
        // Start subscription
        subscription.start();
    } else {
        // New subscription!
        let subscription = new Subscription(name, session, publication, pubParams);
        // Register subscription at session
        session.registerSubscription(subscription);
        // Start subscription
        subscription.start();
    }
}
