import * as mqtt from 'mqtt';

import hello from './hello';
import logger from './logger';
import subscriptionMsg from './subscriptionMsg';
import { Source } from '../source';
import { Things } from '../../Things';
import { SERVER_ID } from '../../config';

// Type of topic handlers
// Topic handler takes payload, parameters, and client as input.
// And perform proper tasks with client object
// Send response to things via client obj,
// or insert some documents into DB, etc.
export type topicHandler = (payload, params?, source?: Source) => void;

// Add topic handlers what you want!
export const topicHandlers: { [topic: string]: topicHandler } = {
    '+thingId/$sub/+name': subscriptionMsg
};
