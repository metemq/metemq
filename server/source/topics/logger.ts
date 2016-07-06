import { Mongo } from 'meteor/mongo';
import { topicHandler	} from './index';
import { Source } from '../source';

const Logs = new Mongo.Collection('logs');

export default function messageLogger(payload, params, source: Source) {
    let topics = params.topics;

    const doc = {
        topic: topics,
        payload: payload,
        date: new Date()
    }

    Logs.insert(doc);

    console.log(`${topics}: ${payload} [#log=${Logs.find().count()}]`);
}
