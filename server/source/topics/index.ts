import * as mqtt from 'mqtt';

import hello from './hello';
import logger from './logger';
import { Things } from '../../Things';

// Type of topic handlers
// Topic handler takes payload, parameters, and client as input.
// And perform proper tasks with client object
// Send response to things via client obj,
// or insert some documents into DB, etc.
export type topicHandler = (payload, params?, client?: mqtt.Client) => void;

// Add topic handlers what you want!
export const topicHandlers: { [topic: string]: topicHandler } = {
    // Say hello to things...
    '+thingId/Hello': hello,
    // Just another example. Insert every messages into collection.
    '#topics': logger
}
