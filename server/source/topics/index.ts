import subscriptionMsg from './subscriptionMsg';
import thingDisconnect from './thingDisconnect';
import methodCall from './methodCall';
import dataBinding from './dataBinding';
import connect from './thingConnect';
import { Source } from '../source';

/**
 * Type of topic handlers
 * Topic handler takes payload, parameters, and client as input.
 * And perform proper tasks with client object
 * Send response to things via client obj,
 * or insert some documents into DB, etc.
 */
export type topicHandler = (payload, params?, source?: Source) => void;

// Add topic handlers what you want!
export const topicHandlers: { [topic: string]: topicHandler } = {
    '+thingId/$sub/+name': subscriptionMsg,
    '+thingId/$disconnect': thingDisconnect,
    '+thingId/$call/+method/+msgId': methodCall,
    '+thingId/$bind/+field/': dataBinding,
    '+thingId/$connect/+msgId': connect
};
